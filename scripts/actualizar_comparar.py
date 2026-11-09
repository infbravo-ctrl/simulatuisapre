# -*- coding: utf-8 -*-
"""
Actualiza la página /comparar-isapres/ con los datos del mes.

Lo corre el robot de GitHub Actions justo después de procesar_planes.py.
- Lee planes_data.js (los mismos datos del simulador) y el GES de simulador.js.
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
    """El GES vive en un solo lugar: simulador.js (el simulador de todo el sitio).
    Si se actualiza ahí, esta página lo sigue."""
    for archivo in ('simulador.js', 'index.html'):
        try:
            m = re.search(r'const GES\s*=\s*(\{[^}]*\})', open(archivo, encoding='utf-8').read())
        except FileNotFoundError:
            continue
        if m:
            return json.loads(m.group(1).replace("'", '"'))
    raise SystemExit('No se encontró el GES en simulador.js')


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
            f'<td class="num" data-k="desde">{uf(min(pb) + g)} UF<span class="t-clp" data-k="clp"></span></td>'
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
        'bajo': f"{bajo['i']} ({uf(bajo['desde'])} UF para 30 años)",
    }


def reemplazar(s, valores):
    for k, v in valores.items():
        s = re.sub(rf'(<!--AUTO:{k}-->).*?(<!--/AUTO:{k}-->)', lambda m: m.group(1) + v + m.group(2), s, flags=re.S)
    return s


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
    nuevo = reemplazar(antes, valores)
    if nuevo == antes:
        print('Comparar isapres: sin cambios en los datos.')
    else:
        hoy = date.today().isoformat()
        nuevo = reemplazar(nuevo, {'fecha': date.today().strftime('%d-%m-%Y')})
        # la fecha que lee Google (dateModified) también queda al día
        nuevo = re.sub(r'("dateModified":")[^"]*(")', lambda m: m.group(1) + hoy + m.group(2), nuevo)
        open(PAGINA, 'w', encoding='utf-8').write(nuevo)
        actualizar_sitemap(hoy)
        print(f'✓ Comparar isapres actualizada ({hoy}).')
