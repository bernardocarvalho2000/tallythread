# TallyThread — Shop Profit Tracker

Produto digital (planilha .xlsx, 17 $) para vendedores Etsy + calculadora grátis de taxas (SEO).

| Pasta | O quê |
|---|---|
| `product/` | `build_tracker.py` gera o .xlsx · `test_tracker.py` testa as fórmulas · `make_previews.py` gera as imagens |
| `site/` | Página de vendas, calculadora grátis, privacidade, termos (HTML estático) |
| `marketing/listings.md` | Textos Gumroad/Etsy, tags, canais de aquisição |
| `ops/` | `monitor.py` (uptime + vendas, diário) · `configure.py` (preenche URLs/email) |
| `.github/workflows/` | Deploy automático do site + monitor diário |
| `LOG.md` | Decisões, pontuação das 11 oportunidades, pendentes |

## Lançamento (≈30 min do proprietário)

1. **Gumroad** (gumroad.com): criar conta → Settings → Payments (ligar banco/PayPal, verificação de identidade).
   New product → Digital product → nome/descrição/recibo de `marketing/listings.md` → preço 17 $ → upload de
   `product/TallyThread-Shop-Profit-Tracker.xlsx` + as 2 imagens de `site/assets/` → Publish. Copiar o URL do produto.
   Settings → Advanced → Applications → criar access token (para o monitor).
2. **GitHub**: criar conta e repositório **público** `tallythread` (Pages grátis exige público).
3. Preencher marcadores:
   `python ops/configure.py --gumroad <URL produto> --site https://<user>.github.io/tallythread --email <email suporte> --operator "<nome>"`
4. Enviar: `git remote add origin https://github.com/<user>/tallythread.git && git push -u origin main`
   GitHub → Settings → Pages → Source: **GitHub Actions**. Settings → Secrets and variables → Actions:
   variável `SITE_URL`, segredo `GUMROAD_TOKEN`.
5. **Google Search Console** (grátis): adicionar o site e submeter `sitemap.xml`.
6. (Opcional) **Etsy**: abrir loja, criar listagem digital com o texto de `marketing/listings.md` (0,20 $).
7. **Fiscal (PT)**: abrir atividade nas Finanças (categoria B) antes da 1.ª venda — confirmar com contabilista.

## Reconstruir / testar
```
python product/build_tracker.py && python product/test_tracker.py   # precisa: pip install formulas
node site/etsy-fee-calculator/calc.test.js
```
