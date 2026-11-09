# -*- coding: utf-8 -*-
"""
Actualiza la página /comparar-isapres/ con los datos del mes.

Lo corre el robot de GitHub Actions justo después de procesar_planes.py.
- Lee planes_data.js (los mismos datos del simulador) y el GES de index.html.
- Guarda el historial en comparar-isapres/historial.json (cantidad de planes y
  precio desde por isapre, mes a mes). Hoy no se muestra en la página: queda
  guardado por si más adelante sirve (por ejemplo, para la página de alzas).
- Reescribe las cifras dentro de las marcas <!--AUTO:nombre--> ... <!--/AUTO:nombre-->.
Así Google, las IA y las personas ven siempre las mismas cifras.
Si los datos no cambiaron, no toca nada.
"""
import json, re, statistics as st
from datetime import date

PAGINA = 'comparar-isapres/index.html'
HISTORIAL = 'comparar-isapres/historial.json'
MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
         'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']


def miles(n):
    return f'{n:,}'.replace(',', '.')


def uf(x):
    return f'{x:.2f}'.replace('.', ',')


def orden(periodo):
    """'septiembre 2026' -> 2026*12 + 8, para ordenar y espaciar los meses."""
    mes, anio = periodo.split()
    return int(anio) * 12 + MESES.index(mes)


def leer_datos():
    s = open('planes_data.js', encoding='utf-8').read()
    return json.loads(s[s.index('{'):s.rindex('}') + 1])


def leer_ges():
    """El GES vive en un solo lugar: index.html. Si se actualiza ahí, esta página lo sigue."""
    s = open('index.html', encoding='utf-8').read()
    m = re.search(r'const GES\s*=\s*(\{[^}]*\})', s)
    return json.loads(m.group(1).replace("'", '"'))


def actualizar_historial(d, ges):
    try:
        h = json.load(open(HISTORIAL, encoding='utf-8'))
    except FileNotFoundError:
        h = {'serie': [], 'codigos': {}}
    per = d['periodo']
    if any(x['periodo'] == per for x in h['serie']):
        return h
    fila = {'periodo': per, 'n': {}, 'desde': {}}
    cods = {}
    for i, g in ges.items():
        P = [p for p in d['planes'] if p['i'] == i]
        if P:
            fila['n'][i] = len(P)
            fila['desde'][i] = round(min(p['pb'] for p in P) + g, 3)
            cods[i] = sorted(p['c'] for p in P)
    h['serie'] = sorted(h['serie'] + [fila], key=lambda x: orden(x['periodo']))[-24:]
    if h['codigos'].get('actual'):
        h['codigos']['anterior'] = h['codigos']['actual']
    h['codigos']['actual'] = {'periodo': per, 'isapres': cods}
    json.dump(h, open(HISTORIAL, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    return h


def tipos(P):
    c = {k: sum(1 for p in P if p['m'] == k) for k in 'PLC'}
    out = [f"{c['P']} preferentes"]
    if c['L']:
        out.append(f"{c['L']} libre elección")
    if c['C']:
        out.append(f"{c['C']} cerrados")
    return ' · '.join(out)




TRAMOS = [('25 a 34', 1.0), ('35 a 44', 1.3), ('45 a 54', 1.4), ('55 a 64', 2.0), ('65 o más', 2.4)]


def pct(a, b):
    return round(100 * a / b) if b else 0


def bloque_prioridades(d, ges):
    """Las 4 prioridades del simulador, con el dato oficial que responde a cada una."""
    por = {i: [p for p in d['planes'] if p['i'] == i] for i in ges}
    por = {i: P for i, P in por.items() if P}

    def top(clave, n=3):
        return sorted(por, key=lambda i: -clave(i))[:n]

    def lista(items):
        return '<ol>' + ''.join(f'<li><b>{i}</b> <span>{txt}</span></li>' for i, txt in items) + '</ol>'

    hosp = top(lambda i: pct(sum(p['ch'] >= 100 for p in por[i]), len(por[i])))
    amb = top(lambda i: pct(sum(p['ca'] >= 80 for p in por[i]), len(por[i])))
    bar = sorted(por, key=lambda i: min(p['pb'] for p in por[i]) + ges[i])[:3]
    lib = [i for i in sorted(por, key=lambda i: -sum(p['m'] == 'L' for p in por[i])) if any(p['m'] == 'L' for p in por[i])][:4]
    sin_lib = [i for i in por if not any(p['m'] == 'L' for p in por[i])]
    tarjetas = [
        ('hosp', 'Mejor cobertura hospitalaria', 'Isapres con más planes que cubren el 100% en hospitalización:',
         lista((i, f'{pct(sum(p["ch"] >= 100 for p in por[i]), len(por[i]))}% de sus planes') for i in hosp)),
        ('amb', 'Mejor cobertura ambulatoria', 'Isapres con más planes que cubren 80% o más en consultas y exámenes:',
         lista((i, f'{pct(sum(p["ca"] >= 80 for p in por[i]), len(por[i]))}% de sus planes') for i in amb)),
        ('precio', 'Pagar lo menos posible', 'Plan más económico con GES, para una persona de 30 años:',
         lista((i, uf(min(p['pb'] for p in por[i]) + ges[i]) + ' UF') for i in bar)),
        ('libre', 'Libre elección de médicos', 'Isapres que venden planes de libre elección:',
         lista((i, f'{sum(p["m"] == "L" for p in por[i])} planes') for i in lib)
         + (f'<p class="pr-nota">{", ".join(sin_lib)}: solo preferentes o cerrados.</p>' if sin_lib else '')),
    ]
    return ''.join(f'<div class="pr"><h3>{t}</h3><p>{intro}</p>{cuerpo}'
                   f'<a class="pr-btn" href="/?prioridad={k}#simulador">Simula con esta prioridad →</a></div>'
                   for k, t, intro, cuerpo in tarjetas)


def bloque_edades(d, ges):
    """Plan más económico de cada isapre según el tramo de edad del titular (Tabla Única de Factores)."""
    filas = []
    for i, g in ges.items():
        P = [p for p in d['planes'] if p['i'] == i]
        if not P:
            continue
        base = min(p['pb'] for p in P)
        celdas = ''.join(f'<td class="num">{uf(base * f + g)}</td>' for _, f in TRAMOS)
        filas.append((base + g, f'<tr><th scope="row">{i}</th>{celdas}</tr>'))
    filas.sort(key=lambda x: x[0])
    cab = ''.join(f'<th scope="col">{t} años</th>' for t, _ in TRAMOS)
    return f'<thead><tr><th scope="col">Isapre</th>{cab}</tr></thead><tbody>{"".join(f for _, f in filas)}</tbody>'


def bloques(d, ges, h):
    filas, resumen = [], []
    for i, g in ges.items():
        P = [p for p in d['planes'] if p['i'] == i]
        if not P:
            continue
        pb = [p['pb'] for p in P]
        resumen.append({'i': i, 'desde': min(pb) + g})
        filas.append((len(P), f'<tr data-i="{i}"><th scope="row">{i}</th>'
            f'<td class="num" data-k="n">{miles(len(P))}</td>'
            f'<td class="num" data-k="desde">{uf(min(pb) + g)} UF<span class="clp" data-k="clp"></span></td>'
            f'<td class="num" data-k="med">{uf(st.median(pb))} UF</td>'
            f'<td data-k="tipos">{tipos(P)}</td>'
            f'<td class="num" data-k="ch">{round(st.median(p["ch"] for p in P))}%</td>'
            f'<td class="num" data-k="ges">{uf(g)} UF</td></tr>'))
    filas.sort(key=lambda x: -x[0])
    bajo = min(resumen, key=lambda r: r['desde'])
    total = miles(len(d['planes']))
    return {
        'filas': ''.join(f for _, f in filas),
        'total': total, 'total2': total,
        'periodo': d['periodo'], 'periodo2': d['periodo'], 'periodo3': d['periodo'],
        'anio': d['periodo'].split()[-1],
        'bajo': f"{bajo['i']} ({uf(bajo['desde'])} UF para 30 años)",
        'prioridades': bloque_prioridades(d, ges),
        'edades': bloque_edades(d, ges),
    }


def reemplazar(s, valores):
    for k, v in valores.items():
        s = re.sub(rf'(<!--AUTO:{k}-->).*?(<!--/AUTO:{k}-->)', lambda m: m.group(1) + v + m.group(2), s, flags=re.S)
    return s


def actualizar_anio_titulo(s, anio):
    """El <title> no admite marcas: se cambia el año directamente."""
    return re.sub(r'(Compara isapres )\d{4}', lambda m: m.group(1) + anio, s)


def actualizar_sitemap(hoy):
    try:
        s = open('sitemap.xml', encoding='utf-8').read()
    except FileNotFoundError:
        return
    for url in ('https://www.simulatuisapre.cl/', 'https://www.simulatuisapre.cl/comparar-isapres/'):
        s = re.sub(rf'(<loc>{re.escape(url)}</loc>\s*<lastmod>)[^<]*(</lastmod>)', lambda m: m.group(1) + hoy + m.group(2), s)
    open('sitemap.xml', 'w', encoding='utf-8').write(s)


if __name__ == '__main__':
    d, ges = leer_datos(), leer_ges()
    h = actualizar_historial(d, ges)
    antes = open(PAGINA, encoding='utf-8').read()
    valores = bloques(d, ges, h)
    nuevo = actualizar_anio_titulo(reemplazar(antes, valores), valores['anio'])
    if nuevo == antes:
        print('Comparar isapres: sin cambios en los datos.')
    else:
        hoy = date.today().isoformat()
        nuevo = reemplazar(nuevo, {'fecha': date.today().strftime('%d-%m-%Y')})
        open(PAGINA, 'w', encoding='utf-8').write(nuevo)
        actualizar_sitemap(hoy)
        print(f'✓ Comparar isapres actualizada ({hoy}).')
