# Veneno Pokemon — site para assinantes

Site estático (HTML, CSS e JS puro) do Veneno Pokemon, macro para OptPokemon.

## Páginas
- `index.html`: página principal com recursos, como funciona, planos, depoimentos e FAQ.
- `area.html`: tela de login da área do assinante (visual pronto, ainda sem back-end).

## Como editar
- **Links de pagamento e Discord:** `assets/config.js`. Enquanto um plano não tiver link, o botão "Assinar" leva ao Discord.
- **Preços:** em `index.html`, na seção `#planos` (atributos `data-mensal` e `data-trimestral`).
- **Cores e visual:** variáveis no topo de `assets/styles.css`.

## Ver localmente
```bash
python3 -m http.server 8000
# abra http://localhost:8000
```

## Publicar no GitHub Pages
Em **Settings → Pages**, escolha "Deploy from a branch", branch `main`, pasta `/ (root)`.
