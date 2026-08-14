# Novera Academy — Landing Page

Landing page de alta conversão com diagnóstico interativo em 5 etapas.

**Stack:** HTML + CSS + JavaScript vanilla. Sem build, sem dependências, sem framework.
A página é um único fluxo (hero → quiz), então React/Vue adicionariam runtime sem ganho —
vanilla entrega LCP menor, que é o que importa numa landing de tráfego pago.

---

## 1. Imagens — já processadas

As fotos enviadas (`1.png`…`7.png`) foram identificadas, renomeadas e convertidas
para JPEG progressivo. Estado atual de `assets/img/`:

| Arquivo                     | Foto                     | Onde aparece                                  |
|-----------------------------|--------------------------|-----------------------------------------------|
| `logo-novera.png`           | Emblema (sem o wordmark) | Nav, modal do quiz, rodapé, favicon           |
| `logo-novera-full.png`      | Emblema + "NOVERA ACADEMY" | CTA final                                   |
| `travel-lisboa.jpg`         | Praia em Portugal        | Fundo da **faixa parallax**                   |
| `travel-barcelona.jpg`      | Montjuïc à noite         | Fundo do **CTA final**                        |
| `og-cover.jpg`              | Recorte 1200×630 de Roma | Preview ao compartilhar em redes sociais      |
| `travel-london.jpg`         | Cabine vermelha / Big Ben| *sem uso*                                     |
| `travel-paris-arco.jpg`     | Arco do Triunfo          | *sem uso*                                     |
| `travel-rome.jpg`           | Coliseu                  | *sem uso* (foi a origem do `og-cover`)        |
| `travel-alpes.jpg`          | Esqui na montanha        | *sem uso*                                     |
| `travel-paris-eiffel.jpg`   | Torre Eiffel             | *sem uso*                                     |

> **5 fotos ficaram sem uso** depois que Destinos, Método, Resultados e Dúvidas passaram
> a usar cor sólida. Somam ~500 KB e continuam no disco: é só apagar, ou reaproveitar
> apontando a classe `.band__bg` / `.final__bg` para outra delas.

### Fundo das seções

Só duas seções ainda usam foto: a **faixa parallax** e o **CTA final**. As demais usam
cor sólida, em duas variações que se alternam para dar ritmo:

| Classe            | Cor                        | Seções                  |
|-------------------|----------------------------|-------------------------|
| `.section--tint`  | lavanda claro (`--lav-100`)| Destinos, Resultados    |
| `.section--deep`  | roxo escuro (`--violet-950`)| Método, Dúvidas        |

Cada uma leva um brilho radial de baixa opacidade no topo — evita o aspecto chapado sem
virar gradiente. Nas seções escuras, cards, depoimentos, FAQ e CTA intermediário viram
**vidro fosco** (`--card-bg` + `--card-blur`) e voltam a branco sólido no tema claro.

### Alinhamento

Um sistema único para a página inteira, definido em `.shead`:

- **Cabeçalho de seção centralizado** — rótulo, título e linha de apoio.
- **Corpo de texto à esquerda** — cards, depoimentos, FAQ e lista de destinos.

A divisão é por tipo de conteúdo, não por seção: parágrafo longo centralizado fica com
a borda esquerda irregular e custa legibilidade. Os títulos usam `text-wrap:balance`,
que iguala o comprimento das linhas em vez de deixar uma órfã curta no fim.

**Peso: 11 MB → 682 KB** (redimensionadas para 1400px de largura máxima, JPEG mozjpeg
qualidade 82). Os PNGs originais estão preservados em `assets/img/_originais/` —
não precisam ir para produção, pode apagar a pasta quando quiser.

### Sobre o logo

O PNG enviado **tem transparência** (confirmado: alfa = 0 nos cantos) e traz o texto
"NOVERA ACADEMY" embutido na arte. Como a nav já exibe esse nome como texto HTML,
usar a arte completa lá duplicaria o wordmark. Por isso existem dois recortes:

- **`logo-novera.png`** — só o emblema, recortado na faixa de pixels transparentes que
  separa o brasão do texto. Usado onde já há texto de marca ao lado.
- **`logo-novera-full.png`** — lockup completo, usado no CTA final, onde o logo aparece sozinho.

Para regerar a partir de um logo novo, o script está em
[`assets/img/_originais/`](assets/img/_originais/) — ou é só recortar à mão e manter os nomes.

### Se trocar as fotos depois

- JPG, lado maior de ~1400 px, qualidade 80–85. Retrato (4:5) funciona melhor.
- Mantenha os mesmos nomes de arquivo e nada mais precisa mudar.
- Comprima antes de subir — [squoosh.app](https://squoosh.app) resolve no navegador.

### O tratamento de cor é automático

Você **não precisa** editar as fotos no Photoshop. O filtro roxo da marca é aplicado
via CSS, numa única variável em `assets/css/styles.css`:

```css
--photo-filter: saturate(.72) contrast(1.08) brightness(.86) hue-rotate(-8deg);
```

Ajuste essa linha se quiser o efeito mais forte ou mais sutil.
No hover, as fotos voltam parcialmente à cor natural — é intencional.

### ⚠ Ao adicionar novas fotos de fundo

Os caminhos das imagens de **background** ficam no CSS (`assets/css/styles.css`),
com prefixo `../img/`, e **não** em `style="--img:url(...)"` no HTML.

Isso não é preferência de estilo: `url()` dentro de uma custom property é resolvido
relativo ao arquivo CSS que a consome, não ao HTML que a declarou. Declarada inline,
a mesma string vira `/assets/css/assets/img/foto.jpg` e dá 404 silencioso —
a página não quebra, só cai no gradiente de fallback, o que torna o erro fácil de não notar.

Fotos em `<img>` (a galeria) não têm esse problema e usam `assets/img/` normalmente.

---

## 1b. Vídeo do hero

`Video background.mp4` (a compilação editada) virou `hero-bg.mp4` e roda **em loop
nativo, sem áudio**, atrás do hero.

| Arquivo                | Papel                                    | Peso    |
|------------------------|------------------------------------------|---------|
| `hero-bg.mp4`          | Fundo do hero                            | 4,5 MB  |
| `poster.jpg`           | Primeiro quadro; aparece antes do vídeo  | 39 KB   |
| `Video background.mp4` | Original — **não** precisa ir p/ produção| 23,8 MB |

**Peso: 23,8 MB → 4,5 MB** (H.264, 480×854, 60→30fps, CRF 31, faixa de áudio removida,
`faststart`). Duração: 49,7 s por volta.

**Para trocar o vídeo:** substitua `hero-bg.mp4`. Para usar **vários** clipes em
sequência, liste todos no array `VIDEOS` no topo de `assets/js/main.js` — com mais de um
item o código passa a encadear por evento `ended` e faz prefetch do próximo; com um item
só usa `loop` nativo, que não tem emenda visível.

Detalhes de implementação:

- **Vertical.** O material é 480×854. No mobile preenche a tela no formato nativo; no
  desktop o `object-fit:cover` recorta as laterais e amplia ~3×. O véu escuro e o leve
  desfoque disfarçam a ampliação — inerente à resolução da origem.
- **Sem áudio de verdade.** A faixa foi removida do arquivo (`-an`), não só silenciada
  pelo atributo `muted`. É também o que permite o autoplay: navegador nenhum toca vídeo
  com som sem interação do usuário.
- **Degrada com elegância.** Em `prefers-reduced-motion`, com "economizar dados" ligado,
  ou se o autoplay for bloqueado, fica o `poster.jpg` estático.

---

## 2. Configurar o destino dos leads

Abra `assets/js/main.js` e edite o bloco `CONFIG` (primeiras linhas):

```js
const CONFIG = {
  whatsappB64: 'NTU0...',     // ← número em base64 (veja abaixo)
  ofertaMsg: 'Quero garantir minha oferta especial.',
  endpoint: null,             // ← URL que recebe o lead (ou null)
  storageKey: 'novera:diagnostico'
};
```

- **`whatsappB64`** — já configurado, guardado em **base64** em vez de texto puro.
  Isso não é segurança: o número é montado no navegador para virar o link, então quem
  abrir o devtools vê. Serve contra robôs que varrem repositórios e arquivos `.js`
  procurando padrão de telefone por regex — codificado, eles não casam.
  Para trocar, rode no console do navegador `btoa('55DDDNUMERO')` e cole o resultado.

  É usado nos **dois** caminhos de WhatsApp da página:
  1. **"Ver minha oferta"** (envio do formulário) → abre o WhatsApp do comercial com a
     mensagem padrão de `ofertaMsg`, em nova aba, e mostra o resultado do diagnóstico
     por trás. Nova aba em vez de troca de página para o lead não perder o diagnóstico.
  2. **"Falar agora no WhatsApp"** (tela de resultado) → mensagem detalhada, montada
     com todas as respostas do diagnóstico.
- **`ofertaMsg`** — a mensagem pré-preenchida do botão "Ver minha oferta".
- **`supabase`** — já configurado, é para onde os leads vão hoje (ver seção abaixo).
- **`endpoint`** — opcional. Se preenchido, o lead vai para lá **em vez** do Supabase.
  Serve para Formspree, n8n/Make/Zapier ou uma API própria.

O payload enviado:

```json
{
  "objetivo": "Viajar / Morar fora",
  "nivel": "Intermediário",
  "dificuldade": "Falar e conversar",
  "prazo": "O quanto antes",
  "conversa": "Sim, mas preciso escolher um horário",
  "data": "2026-08-20",
  "hora": "14:30",
  "nome": "Ana Paula Souza",
  "email": "ana@exemplo.com",
  "telefone": "(11) 98765-4321",
  "enviadoEm": "2026-08-13T15:47:13.261Z",
  "origem": "https://noveraacademy.com.br/",
  "referrer": "https://instagram.com/"
}
```

As respostas são gravadas no `localStorage` **a cada clique**, não só no envio final —
então um lead que abandona no meio deixa rastro para remarketing. Mas atenção: esse
rastro fica no navegador **do visitante**. Só o envio do formulário grava no Supabase.

---

## 2b. Supabase — onde os leads caem

Projeto `cnrdaxjglkxxlcultkjg` (região São Paulo), tabela `public.leads`.
Cada envio do formulário vira uma linha, com as 5 respostas, os dados de contato,
o agendamento (quando houver), o plano recomendado e a origem do tráfego.

### Segurança: por que a chave no código não é um problema

A chave *publishable* fica visível no `main.js` — isso é por design, ela vai para o
navegador de todo visitante. Quem protege os dados é o **RLS** da tabela:

```sql
alter table public.leads enable row level security;

create policy "qualquer visitante pode enviar o formulario"
  on public.leads for insert
  to anon, authenticated
  with check (true);
```

Há policy **só para INSERT**. Sem policy de `select`, `update` ou `delete`, essas
operações ficam negadas por padrão. Testado com a chave real: `SELECT` devolve `[]`,
e tentativas de `DELETE`/`UPDATE` não alteram nada.

> A chave **secreta** (`service_role`) ignora RLS por completo. Ela nunca pode entrar
> neste projeto nem no Git — use-a só no painel do Supabase ou em servidor.

Para ler os leads, use o Table Editor do painel, ou conecte o banco a um BI.

### Por que a página não usa `@supabase/supabase-js`

Os pacotes `@supabase/supabase-js` e `@supabase/ssr` estão no `package.json`, mas a
página **não os importa**. O site é estático, sem bundler — um `<script>` comum não
consegue resolver `import` de `node_modules`. E `@supabase/ssr` é para renderização
no servidor com sessão em cookie, que não existe aqui e serve a autenticação, que o
projeto não usa.

A inserção é feita com um `fetch` direto na API REST (PostgREST) do Supabase, em
`send()`. Zero dependência em tempo de execução, mesmo resultado.

**Não use `navigator.sendBeacon` para o Supabase.** Ele não permite definir cabeçalhos
(`apikey` e `Authorization` são obrigatórios) e o `Content-Type: application/json`
dispara um preflight de CORS que o beacon não executa — ele retornaria `true` e a
requisição morreria em silêncio. O código usa `fetch` com `keepalive`, que sobrevive
à saída da página do mesmo jeito.

### Onde ficam as credenciais

Em `CONFIG.supabase`, no topo de `assets/js/main.js`. O `.env` existe e tem os mesmos
valores, mas **não é lido pela página**: sem build, nada resolve `.env` em tempo de
execução, e o prefixo `NEXT_PUBLIC_` só significa algo para o Next.js. Se um dia o
projeto ganhar um framework, migre para as variáveis e mantenha os dois em sincronia.

---

## 3. Rodar localmente

```bash
npx serve -l 4321 .
```

Depois abra `http://localhost:4321`.

> Abrir o `index.html` direto com duplo clique também funciona, mas alguns navegadores
> bloqueiam recursos em `file://`. Prefira o servidor.

---

## 4. Publicar

É um site estático — sobe em qualquer lugar, sem build.

### Vercel (configurado)

Importe o repositório em vercel.com. Framework preset: **Other**. Deixe *Build Command*
e *Output Directory* vazios — não há build. O deploy roda a cada push na `main`.

Dois arquivos cuidam do resto:

- **`.vercelignore`** — tira do deploy os ~37 MB de mídia original
  (`assets/img/_originais/` e `assets/video/Video background.mp4`). Eles estão no Git
  de propósito, como backup, mas não têm por que ser servidos ao público.
- **`vercel.json`** — cabeçalhos de segurança e política de cache:
  HTML sempre revalidado, `/assets/*` com 1 dia de cache e revalidação em segundo
  plano por 7 dias. O cache não é eterno porque os nomes de arquivo não têm hash —
  com `immutable`, trocar uma foto deixaria o visitante recorrente vendo a antiga.

### Domínio

`https://noveraacademy.com.br/` aparece em **5 pontos** do `index.html`: `canonical`,
`og:url`, `og:image`, `twitter:image` e duas chaves do JSON-LD. Ao apontar o domínio
na Vercel (Settings → Domains), confira se todos batem.

`og:image` **precisa ser URL absoluta** — os robôs do WhatsApp, Facebook e LinkedIn não
resolvem caminho relativo, e sem isso o link compartilhado sai sem imagem de preview.

> **Windows → Linux:** a Vercel serve de um sistema que diferencia maiúsculas de
> minúsculas; o Windows não. Um `Logo.png` referenciado como `logo.png` funciona na
> sua máquina e dá 404 em produção. As referências atuais foram conferidas uma a uma.

---

## 5. Onde mexer no conteúdo

| O que mudar                        | Onde                                                              |
|------------------------------------|-------------------------------------------------------------------|
| Headline, textos, depoimentos, FAQ | `index.html`                                                      |
| Cidades da faixa rolante           | `index.html` → `.marquee__track` (as duas metades são idênticas)  |
| Cor de fundo de uma seção          | troque a classe `.section--tint` ↔ `.section--deep` na seção      |
| Foto da faixa / do CTA final       | `assets/css/styles.css` → `.band__bg` e `.final__bg`              |
| Lista de destinos                  | `index.html` → `.destlist`                                        |
| Cores da marca                     | `assets/css/styles.css` → bloco `:root` (`--violet-*`)            |
| Claro ↔ escuro de uma seção        | adicione/remova a classe `zone-dark` na seção                     |
| Cantos dos botões                  | `assets/css/styles.css` → `--r-btn` (hoje `10px`; `999px` = pílula)|
| Texto da barra fixa de CTA         | `index.html` → `#ctaBar`                                          |
| Intensidade do filtro roxo         | `assets/css/styles.css` → `--photo-filter`                        |
| Vídeo(s) do hero                   | `assets/js/main.js` → array `VIDEOS`                              |
| Perguntas e opções do quiz         | `index.html` → seções `.step` (o JS lê `data-key` e `data-value`) |
| Planos recomendados                | `assets/js/main.js` → objeto `PLANOS`                             |
| Textos dos "próximos passos"       | `assets/js/main.js` → função `proximosPassos()`                   |

### Como funciona a paleta

A página é **clara** (branco/lavanda, texto roxo-escuro) com **zonas escuras** onde há
mídia por trás: hero, faixa parallax, CTA final e rodapé. O contraste do texto sobre
vídeo/foto só fecha em fundo escuro — daí o ritmo alternado.

**Cores de apoio.** Além dos roxos, a paleta tem quatro cores que harmonizam com eles.
Magenta e índigo são vizinhas do roxo no círculo cromático, então a transição é natural
e podem ocupar área grande; âmbar e turquesa são contraste, e entram só em detalhe —
se ganharem área, brigam com a marca.

| Cor      | Token             | Onde aparece                                        |
|----------|-------------------|-----------------------------------------------------|
| Magenta  | `--magenta-500`   | Fim do gradiente dos botões, faixa de cidades, pilar 02 |
| Índigo   | `--indigo-500/600`| Bloco de métricas, barra fixa                       |
| Âmbar    | `--amber-400`     | Ponto pulsante dos rótulos de seção, ✦ da faixa      |
| Turquesa | `--teal-400/500`  | Pilar 03, "100% gratuito" na barra fixa             |

O roxo mais escuro (`--violet-950`, `#1A0533`) é a base das zonas escuras e do
gradiente `--grad-deep`.

Isso é feito com um único mecanismo: `:root` define os tokens claros, e a classe
`.zone-dark` **redefine só os tokens** (`--text`, `--line`, `--surface`, `--accent`…).
Nenhum componente é duplicado — o mesmo `.btn`, `.eyebrow` ou `.card` funciona nos dois
fundos. A nav é o caso especial: nasce `zone-dark` sobre o hero e `.is-stuck` reverte
os tokens para roxo-sobre-branco quando ela gruda no topo.

Para adicionar uma pergunta nova: duplique um bloco `<section class="step">`,
ajuste `data-step` e `data-key`, e atualize `TOTAL_QUESTIONS` / `LAST_STEP` no JS.

---

## 6. O que já está implementado

**Navegação e coesão visual**
- Parallax em 3 profundidades via `requestAnimationFrame`, com culling de elementos
  fora da viewport (não gasta CPU com o que não está na tela)
- Scroll reveal reversível: os elementos reagem tanto descendo quanto subindo,
  voltando ao estado inicial ao sair de vista — o efeito se repete na subida
- Parallax nas duas seções que ainda usam foto (faixa e CTA final)
- Nav que se condensa e ganha blur ao rolar; contadores animados; marquee de destinos

**Caminhos até o CTA**
O botão "Obter oferta" aparece em 7 pontos, para o visitante nunca precisar procurá-lo:
nav, hero, depois da galeria, depois das métricas, faixa parallax, CTA final e a
**barra fixa** no rodapé da tela. A barra sobe quando o hero sai de vista e some
sozinha em duas situações: no CTA final (onde o botão grande já está em cena) e com o
diagnóstico aberto.

**Quiz**
- 5 perguntas: seleciona a opção e clica em **Continuar** (sem avanço automático —
  quem responde controla o ritmo e pode trocar de ideia antes de seguir)
- **Voltar** disponível em todas as etapas a partir da 2ª, **inclusive na tela final**,
  de onde retorna para a etapa de contato
- Transição direcional: entra pela direita ao avançar, pela esquerda ao voltar
- Campo de data/hora que só aparece na opção "preciso escolher um horário",
  já pré-preenchido e com data mínima = hoje
- Etapa de contato com validação e máscara de telefone brasileira
- Tela final com plano recomendado calculado a partir de objetivo + nível + dificuldade

**Acessibilidade**
- `radiogroup`/`radio` com navegação por setas, Enter e Espaço
- Focus trap no modal, `Esc` fecha, foco devolvido ao botão de origem
- Skip link, `:focus-visible` em tudo, contraste AA no texto sobre roxo
- `prefers-reduced-motion` desliga parallax, reveals e o vídeo de fundo
- Vídeo do hero é decorativo: `aria-hidden`, fora da ordem de tabulação e sem áudio

**Performance e SEO**
- Zero dependências JS; CSS e JS somam menos de 40 KB não comprimidos
- `preload` do poster do hero, `loading="lazy"` no resto; vídeos sob demanda
- Meta tags completas, Open Graph, canonical e JSON-LD `EducationalOrganization`

---

## 7. Antes de subir — checklist

- [x] Imagens processadas e nomeadas em `assets/img/`
- [x] Vídeos convertidos e tocando em sequência
- [x] `CONFIG.whatsappB64` com o número real do comercial (codificado)
- [ ] **Métricas da seção Método conferidas** — ver o comentário `⚠ CONFERIR` no
      `index.html`. São afirmações públicas que eu não pude verificar:
      93% · +6 países · +6 estados, e as listas ("Irlanda · Reino Unido · Portugal ·
      Itália · Espanha · França" e "SP · RJ · MG · PR · SC · RS").
- [x] Destino dos leads configurado (Supabase, tabela `public.leads`, RLS ativo)
- [ ] Domínio real no `canonical` e nas tags Open Graph
- [ ] Depoimentos substituídos por reais (os atuais são exemplos)
- [ ] Apagar `assets/img/_originais/` e `assets/video/Video background.mp4` antes do deploy
- [ ] Pixel do Meta / GA4 colado antes de `</head>`
  (o JS já dispara `dataLayer.push({event:'novera_lead'})` na conversão)
```
