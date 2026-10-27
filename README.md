# Meu Bolso

Aplicativo de controle financeiro pessoal para celular. Funciona no navegador, pode ser
instalado na tela inicial como um app e continua funcionando sem internet.

## O que ele faz

- **Saldo do mês**: receitas, despesas e quanto sobrou.
- **Quanto posso gastar por dia**: divide o que resta da renda pelos dias que faltam no mês.
- **Lançamentos**: receitas e despesas por categoria, com busca e filtros.
  - **Parcelado**: divide uma compra em N parcelas nos próximos meses (ex.: 10× no cartão).
  - **Fixa mensal**: repete contas fixas (aluguel, internet) pelos próximos meses.
- **Orçamento**: limite mensal por categoria, com aviso ao chegar a 80% e quando estoura.
- **Regra 50/30/20**: compara seus gastos com o ideal (50% necessidades, 30% desejos, 20% futuro).
- **Metas**: quanto guardar por mês para chegar no objetivo até o prazo, e o tamanho ideal da
  reserva de emergência com base no seu custo de vida.
- **Gráficos**: para onde foi o dinheiro e os últimos 6 meses.
- **Backup**: baixar, copiar e restaurar os dados em um arquivo `.json`.

Os dados ficam só no aparelho (no armazenamento do navegador). Nada é enviado para servidor.
Faça backup de vez em quando pela engrenagem ⚙ no topo.

## Como colocar no celular

O site é publicado pelo GitHub Pages a partir da branch `main`.

1. O repositório precisa ser **público** (o Pages gratuito não publica repositório privado).
   Em **Settings → General → Danger Zone → Change visibility → Public**.
   Só o código fica visível. Seus lançamentos ficam no celular e nunca vão para o GitHub.
2. Em **Settings → Pages**, no campo **Source** escolha **Deploy from a branch**,
   depois a branch **main** e a pasta **/ (root)**, e clique em **Save**.
3. Em 1 ou 2 minutos o endereço aparece no topo da página de Pages:
   `https://jefersonramos637-max.github.io/App-financeiro/`
4. Abra esse endereço no **Safari** do iPhone, toque em **Compartilhar** →
   **Adicionar à Tela de Início** → **Adicionar**.

Para atualizar o app depois, basta enviar as mudanças para a `main`.

## Rodar no computador

Não precisa instalar nada. Na pasta do projeto:

```bash
python3 -m http.server 8000
```

E abra `http://localhost:8000`.

## Arquivos

| Arquivo | Para que serve |
|---|---|
| `index.html` | Estrutura das telas |
| `styles.css` | Visual (tema claro e escuro automáticos) |
| `app.js` | Toda a lógica: lançamentos, orçamento, metas, gráficos, backup |
| `sw.js` | Funcionamento offline. Ao alterar o app, aumente `CACHE` (ex.: `meubolso-v2`) |
| `manifest.webmanifest` | Nome, cor e ícones para instalar como app |
| `icons/` | Ícones do app |
