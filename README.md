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
- **Desfazer**: ao excluir um lançamento ou meta, dá para desfazer na hora.
- **Gestos**: arraste para os lados para trocar de mês e o painel para baixo para fechar.

## Segurança e dados

- **PIN com criptografia**: com o PIN ativo, os dados ficam gravados cifrados (AES-GCM de 256 bits,
  chave derivada do PIN com PBKDF2-SHA256, 600 mil iterações). A chave só existe na memória
  enquanto o app está aberto. Bloqueio automático ao sair do app (na hora, 1 ou 5 minutos)
  e espera crescente depois de 5 PINs errados.
  Se esquecer o PIN, não há como recuperar os dados: mantenha um backup.
- **Esconder valores**: o ícone de olho troca todos os valores por `R$ •••`.
- **Pontos de restauração**: uma cópia automática por dia dos últimos 7 dias (IndexedDB).
- **Backup**: salva pelo menu Compartilhar do iPhone (Arquivos, Drive, WhatsApp). Com PIN ativo,
  o backup sai cifrado com o mesmo PIN. Lembrete quando passa de 30 dias sem backup.
- **Planilha**: exporta tudo em CSV para Excel/Google Planilhas (sem proteção do PIN).
- **Proteções**: política de segurança de conteúdo (CSP) que só permite código do próprio app,
  textos escapados antes de ir para a tela e proteção contra fórmulas maliciosas no CSV.

Os dados ficam só no aparelho. Nada é enviado para servidor.

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
| `sw.js` | Funcionamento offline. Ao alterar o app, aumente `CACHE` (ex.: `meubolso-v3`) para o celular oferecer a atualização |
| `manifest.webmanifest` | Nome, cor e ícones para instalar como app |
| `icons/` | Ícones do app |
