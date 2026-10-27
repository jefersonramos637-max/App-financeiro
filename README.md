# Meu Bolso

Aplicativo de controle financeiro pessoal para celular. Funciona no navegador, pode ser
instalado na tela inicial como um app e continua funcionando sem internet.

## O que ele faz

- **Saldo do mês**: receitas, despesas e quanto sobrou.
- **Meu salário**: dias e valores de pagamento (ex.: dia 15 e dia 30). O app lança o salário sozinho
  nos próximos 12 meses e, se o dia cair no fim de semana, pode antecipar para a sexta.
- **Quanto posso gastar por dia**: com o salário configurado, conta até o próximo pagamento: o que já
  entrou menos tudo o que sai antes dele (contas e parcelas futuras inclusive), dividido pelos dias
  que faltam. Sem salário configurado, divide o saldo pelos dias que faltam no mês.
- **Lançamentos**: receitas e despesas por categoria, com busca e filtros.
  - **Parcelado**: divide uma compra em N parcelas nos próximos meses (ex.: 10× no cartão).
  - **Fixa mensal**: repete contas fixas (aluguel, internet) pelos próximos meses.
- **Dívidas**: cadastre empréstimos, financiamentos e compras parceladas com o valor da parcela,
  o total de parcelas e quantas já pagou. O app mostra sozinho qual é a próxima parcela
  (ex.: 5 de 12), quantas faltam, quanto falta pagar, quando termina e avisa perto do vencimento.
  No dia do vencimento a parcela conta como paga; se pagar antes, toque em “Paguei esta parcela”.
  As parcelas podem entrar no extrato de cada mês.
- **Plano para quitar**: informe quanto consegue colocar a mais por mês e o app escolhe a ordem
  (menor dívida primeiro ou maiores juros primeiro, quando os juros são informados), mostra quando
  cada dívida acaba e em quantos meses antes você fica livre. A parcela de uma dívida quitada passa
  a reforçar a próxima.
- **Propostas de quitação**: registre o valor oferecido pelo banco, a validade e de onde veio. O app
  mostra o desconto em R$ e %, avalia a proposta e, ao aceitar, quita a dívida.
- **Dívidas em atraso (negativadas)**: cadastre pelo valor total, sem parcelas nem vencimento. Elas não
  entram no extrato nem nas contas a pagar, nunca são dadas como pagas sozinhas e recebem propostas de
  desconto. O plano para quitar usa a melhor proposta de cada uma.
- **Antecipar parcelas**: registre parcelas pagas adiantadas e o valor pago com desconto.
- **Contas a pagar**: contas fixas, parcelas e gastos marcados como “ainda não paguei” aparecem na
  tela inicial até o próximo salário, com “✓ Paguei”, aviso de atrasadas e lembretes no calendário
  do celular (arquivo .ics com alarme às 9h do dia anterior).
- **Cartões de crédito**: dia de fechamento, vencimento e limite. Ao lançar um gasto, escolha o
  cartão: a compra entra na fatura certa (no dia do fechamento ou depois vai para a seguinte) e o
  dinheiro conta no vencimento da fatura. Parcelado no cartão cai em faturas seguidas. A tela
  inicial mostra a fatura atual e o limite disponível; a fatura entra nas contas a pagar.
- **Limites**: limite mensal por categoria, com aviso ao chegar a 80% e quando estoura.
- **Regra 50/30/20**: compara seus gastos com o ideal (50% necessidades, 30% desejos, 20% futuro).
- **Metas**: quanto guardar por mês para chegar no objetivo até o prazo, e o tamanho ideal da
  reserva de emergência com base no seu custo de vida.
- **Como chegar na meta**: em cada meta, mostra quanto guardar por mês (no prazo, mais folgado e mais
  rápido), em quanto tempo chega e quanto rende, com o rendimento anual líquido que você escolher
  (padrão 10%, abaixo do CDI para ser conservador). Simula qualquer valor por mês e traz um guia de
  onde guardar com segurança conforme o prazo (Tesouro Selic, CDB, LCI/LCA, Tesouro IPCA+) e a tabela
  do Imposto de Renda. É informação educativa, não recomendação de investimento.
- **Aparência**: em ⚙ → Aparência, modo Automático (segue o iPhone), Claro ou Escuro e oito paletas
  completas (Esmeralda, Oceano, Safira, Ametista, Rubi, Cobre, Oliva, Grafite). Cada paleta define fundo,
  cartões, textos e destaque, em versão clara e escura, geradas em OKLCH e conferidas: texto 7:1, botões e
  links 5:1 ou mais e textos de apoio 4,5:1 ou mais. Fica guardada só neste aparelho, fora dos dados
  protegidos por PIN, e vale já na tela de bloqueio.
- **Tela travada**: a página não desliza, não estica nem dá zoom; só o conteúdo rola na vertical e topo e
  abas ficam parados. Os gestos de arrastar (deslizar para trocar de mês, puxar para atualizar, arrastar
  o painel para fechar) são opcionais, desligados por padrão, em ⚙ → Aparência. Os painéis têm botão X.
- **Ícones**: biblioteca própria de ícones de traço (24×24, mesmo estilo), usada nas categorias, dívidas,
  cartões e avisos. As metas têm 40 opções de ícone. Os emojis que ainda aparecem em textos são trocados
  por ícones automaticamente, e metas antigas que guardavam emoji são convertidas.
- **Gráficos**: para onde foi o dinheiro e os últimos 6 meses.
- **Desfazer**: ao excluir um lançamento ou meta, dá para desfazer na hora.
- **Gestos**: arraste para os lados para trocar de mês e o painel para baixo para fechar.
- **Atualização suave**: quando sai versão nova aparece um cartão com as novidades; ao atualizar,
  uma tela mostra o progresso e, no fim, as novidades com confete. Puxe a tela para baixo para
  procurar atualização a qualquer momento.

## Código do assistente

Em ⚙ → “Colar código do assistente”, o app aceita um texto em JSON com dados para adicionar ou
atualizar (cartões com fatura em aberto, salário, dívidas e contas fixas). Nada é apagado, colar o
mesmo código de novo não duplica, e tudo passa pela mesma validação do app. Exemplo:

```json
{"meubolso":"add","cards":[{"name":"Meu cartão","dueDay":10,"closingDay":3,"limit":150000,"openInvoice":42000}]}
```

Valores em centavos; datas no formato AAAA-MM-DD.

## Segurança e dados

- **PIN com criptografia**: com o PIN ativo, os dados ficam gravados cifrados (AES-GCM de 256 bits,
  chave derivada do PIN com PBKDF2-SHA256, 600 mil iterações). A chave só existe na memória
  enquanto o app está aberto. Bloqueio automático ao sair do app (na hora, 1 ou 5 minutos)
  e espera crescente depois de 5 PINs errados.
  Se esquecer o PIN, não há como recuperar os dados: mantenha um backup.
- **Esconder valores**: o ícone de olho troca todos os valores por `R$ •••`.
- **Pontos de restauração**: uma cópia automática por dia dos últimos 7 dias (IndexedDB).
- **Backup**: salva pelo menu Compartilhar do iPhone (Arquivos, Drive, WhatsApp). Com PIN ativo,
  o backup sai cifrado com o mesmo PIN. Lembrete todo dia na primeira abertura (com “Hoje não”),
  com o passo a passo para salvar no iCloud Drive; dá para desligar e ficar só com o aviso de 30 dias.
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
| `sw.js` | Funcionamento offline e versão do app. Ao publicar mudanças, aumente `VERSION` e escreva as novidades em `NOTES`: o celular mostra o aviso de atualização com essa lista |
| `manifest.webmanifest` | Nome, cor e ícones para instalar como app |
| `icons/` | Ícones do app |


## Conselheiro (aba Dívidas)
O plano para quitar agora mostra um passo a passo (fatura do cartão, parcelas, propostas, reserva mínima) e, depois da última dívida, quanto o mesmo valor rende guardado todo mês. O valor que sobra pode ser informado por quinzena ou por mês.

## Face ID
Com o PIN ativo, em ⚙ → Segurança dá para ligar o Face ID (passkey do iPhone com a extensão PRF). A chave dos dados fica embrulhada por um segredo que só o Face ID libera. Se o iOS não suportar a extensão, o app avisa e segue só com o PIN. Trocar ou remover o PIN desliga o Face ID.
