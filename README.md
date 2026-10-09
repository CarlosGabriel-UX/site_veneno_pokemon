# Injection — scripts e macros por assinatura

Site estático (HTML, CSS e JS puro), pronto para GitHub Pages.

## Páginas
- `index.html`: vitrine com todos os jogos, como funciona e FAQ.
- `jogos/<jogo>.html`: página de cada jogo (recursos, planos e FAQ), ex.: `jogos/optpokemon.html`.
- `area.html`: login da área do assinante (visual pronto, ainda sem back-end).

## Como editar
- **Jogos, textos, recursos e preços:** `assets/games.js`. Cada jogo é um bloco; `status: "em-breve"` mostra o card desativado.
- **Adicionar um jogo:** crie o bloco em `assets/games.js` e copie `jogos/optpokemon.html` para `jogos/<slug>.html`, trocando `data-game="<slug>"` e o título.
- **Links de pagamento, Discord e e-mail:** `assets/config.js`. Sem link de checkout, o botão "Assinar" leva ao Discord.
- **Cores e visual:** variáveis no topo de `assets/styles.css`.

## Ver localmente
```bash
python3 -m http.server 8000
# abra http://localhost:8000
```
