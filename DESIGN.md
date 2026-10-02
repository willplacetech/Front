# Placetech — DESIGN.md

> Design system para e-commerce de smartphones premium (iPhones/Xiaomi).
> Tema escuro, acento laranja único, estética premium e minimalista.
> Usar em todo componente novo. Se um elemento não couber aqui, pergunte antes de inventar.

## 1. Visual Theme & Atmosphere
- **Mood:** premium, escuro, confiável. Fundo quase-preto com brilho quente sutil (laranja) nos cantos/cabeçalhos.
- **Densidade:** espaçosa. Conteúdo com respiro; nunca apertado.
- **Filosofia:** laranja é reservado a CTA, preço e estado ativo. Nunca decorativo.
- **Padrão recorrente:** eyebrow em MAIÚSCULO com espaçamento de letras, precedido por um traço curto laranja (ex: "— CATÁLOGO 2026").

## 2. Color Palette & Roles
| Token | Hex | Papel |
|---|---|---|
| `--bg-base` | `#0A0A0B` | fundo da página |
| `--bg-surface` | `#141416` | cards, inputs, pills inativas |
| `--bg-surface-2` | `#1C1C20` | hover de card, dropdowns |
| `--border` | `rgba(255,255,255,0.08)` / `#26262B` | bordas sutis |
| `--brand` | `#F5A524` | CTA primário, preço, estado ativo, links de ênfase |
| `--brand-hover` | `#FFB93E` | hover de botão primário |
| `--brand-pressed` | `#D98C0E` | pressed |
| `--brand-glow` | `rgba(245,165,36,0.35)` | sombra/brilho ao redor de CTAs |
| `--text-primary` | `#F5F5F4` | títulos, texto principal |
| `--text-secondary` | `#A1A1AA` | corpo, legendas |
| `--text-muted` | `#71717A` | placeholders, dados secundários |
| `--success` | `#22C55E` | "Disponível em estoque" (usar pouco) |

Texto sobre `--brand`: usar `#0A0A0B` (quase-preto), nunca branco.

## 3. Typography
- Família: `Inter, system-ui, -apple-system, sans-serif`. (Se o projeto usa outra, mantenha uma sans-serif moderna.)
- **Hierarquia:**
  - Display (hero): 48–64px, weight 700–800, line-height 1.05, `--text-primary`
  - H1: 32–40px, weight 700, line-height 1.15
  - H2 (seção): 24–28px, weight 700
  - H3 (card/produto): 16–18px, weight 600
  - Body: 15–16px, line-height 1.6, `--text-secondary`
  - Eyebrow: 11–12px, uppercase, letter-spacing 0.15em, `--text-secondary`, com traço `--brand` à esquerda
  - Preço: 22–28px, weight 700, `--brand`
  - Badge/categoria: 10–11px, uppercase, letter-spacing 0.12em

## 4. Component Stylings
**Botão primário** — pill (`border-radius: 999px`), fundo `--brand`, texto `#0A0A0B`, weight 600, padding 12px 24px, sombra `0 0 24px var(--brand-glow)`. Hover: `--brand-hover`.
**Botão secundário** — pill, fundo `--bg-surface`, borda `--border`, texto `--text-primary`. Hover: `--bg-surface-2`.
**Card de produto** — `border-radius: 16–20px`, fundo `--bg-surface`, borda `--border`, padding 20px. Hover: borda `rgba(245,165,36,0.4)` + elevação sutil. Badge de categoria no topo: uppercase, texto `--brand`, fundo `rgba(245,165,36,0.1)`, borda `rgba(245,165,36,0.3)`, pill.
**Pill de filtro** — inativa: `--bg-surface` + borda + `--text-secondary`. Ativa: fundo `--brand` + texto `#0A0A0B`.
**Input** — `border-radius: 12px`, fundo `--bg-surface`, borda `--border`, placeholder `--text-muted`. Focus: borda `--brand` + `box-shadow: 0 0 0 3px rgba(245,165,36,0.2)`.
**Nav** — fixa no topo, fundo `--bg-base` com blur, links `--text-secondary` (hover `--text-primary`), CTA "Meu carrinho" como botão primário pill.

## 5. Layout Principles
- Container: `max-width: 1240px`, padding lateral 24px, centralizado.
- Escala de espaçamento: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96px. Sem valores fora da escala.
- Grid de catálogo: 3 colunas (desktop) → 2 (tablet) → 1 (mobile). Gap 24px.
- Seções: margem vertical mínima de 64px entre blocos.
- Hero: conteúdo alinhado à esquerda, título grande, CTA primário + secundário lado a lado.

## 6. Depth & Elevation
- Sombras suaves e escuras, nunca duras. 3 níveis:
  - `e1` (cards): `0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 24px rgba(0,0,0,0.4)`
  - `e2` (dropdowns/modais): `0 16px 48px rgba(0,0,0,0.6)` + borda `--border`
  - `glow` (CTA ativo): `0 0 24px var(--brand-glow)`
- Superfaces empilhadas: cada nível sobe de `--bg-surface` para `--bg-surface-2`.

## 7. Do's and Don'ts
**Do:** usar laranja apenas em CTA/preço/ativo; eyebrow uppercase com traço laranja; cantos arredondados em elementos interativos; fundos sempre na família do quase-preto.
**Don't:** usar roxo/índigo/azul como acento; fundo laranja em área grande; texto com contraste abaixo de `--text-muted`; cantos vivos (90°) em botões/cards; mais de uma cor de destaque além do laranja; modo claro.

## 8. Responsive Behavior
- Breakpoints: 640 / 768 / 1024 / 1280px.
- Touch target: mínimo 44×44px em botões e links tocáveis.
- Nav: colapsa para hambúrguer abaixo de 768px.
- Grid: 3→2→1 colunas. Comparativos lado a lado empilham no mobile.
- Tipografia: display reduz para 36–40px no mobile.

## 9. Agent Prompt Guide (cola nos prompts do Codex)
> "Siga o DESIGN.md: fundo `#0A0A0B`, superfícies `#141416`, acento laranja `#F5A524` reservado a CTA/preço/ativo, botões pill com brilho laranja, cards 16px radius com borda sutil, eyebrow uppercase com traço laranja, Inter, container 1240px. Não use roxo/azul nem modo claro."