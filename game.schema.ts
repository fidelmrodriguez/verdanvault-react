export const HERO_BACKGROUND = '/game-art/temple-expedition-background.png';
export const LOADING_ART = '/game-art/loading-screen.webp';
export const HERO_MASCOTS = {
  1: '/game-art/fox-explorer-idle.png',
  2: '/game-art/fox-explorer-win.png',
  3: '/game-art/fox-explorer-big-win.png',
  4: '/game-art/fox-explorer-grand-win.png',
  5: '/game-art/fox-searching.png',
  6: '/game-art/fox-no-reward.png',
} as const;
export const PRELOAD_ART = [LOADING_ART, HERO_BACKGROUND, ...Object.values(HERO_MASCOTS)] as const;

export type HeroMascotState = 1 | 2 | 3 | 4 | 5 | 6;
export type HeroStoryState = 'idle' | 'busy' | 'miss' | 'win' | 'big' | 'grand';
export type HeroStory = { kicker: string; headline: string; body: string };

export const HERO_STORIES: Record<HeroStoryState, readonly HeroStory[]> = {
  idle: [
    {
      kicker: 'A EXPEDIÇÃO CONTINUA',
      headline: 'A próxima descoberta ainda dorme entre as ruínas.',
      body: 'Cada giro abre um novo caminho pelo templo. Observe os símbolos e siga os sinais deixados pelos antigos guardiões.',
    },
    {
      kicker: 'ECOS DO TEMPLO',
      headline: 'Há alguma coisa brilhando além das pedras.',
      body: 'As câmaras mais antigas ainda não foram exploradas. Uma combinação pode revelar uma passagem esquecida.',
    },
    {
      kicker: 'MAPA INCOMPLETO',
      headline: 'Nem todos os caminhos aparecem à primeira vista.',
      body: 'A selva esconde atalhos, câmaras e relíquias. Continue a expedição e deixe os rolos indicarem a próxima rota.',
    },
    {
      kicker: 'SANTUÁRIO VERDE',
      headline: 'O templo muda toda vez que você retorna.',
      body: 'Pedras antigas, símbolos vivos e uma energia difícil de explicar. Há sempre mais uma história esperando para ser encontrada.',
    },
    {
      kicker: 'SINAIS NAS RUÍNAS',
      headline: 'Os símbolos parecem formar um padrão.',
      body: 'Talvez seja coincidência. Talvez seja um convite. Continue girando e descubra até onde essa trilha leva.',
    },
    {
      kicker: 'ENTRE CIPÓS E PEDRA',
      headline: 'A selva guardou este lugar por tempo demais.',
      body: 'Agora cada giro remove um pouco do silêncio. Relíquias, inscrições e passagens começam a reaparecer.',
    },
    {
      kicker: 'CÂMARA EXTERNA',
      headline: 'A entrada foi encontrada. O verdadeiro mistério começa agora.',
      body: 'As primeiras relíquias são apenas pistas. Quanto mais fundo você avança, mais raro se torna o que o templo pode revelar.',
    },
    {
      kicker: 'LUZ ENTRE AS FOLHAS',
      headline: 'Alguma coisa desperta no coração das ruínas.',
      body: 'A energia esmeralda percorre as paredes e ilumina símbolos esquecidos. O próximo giro pode aproximar você da origem dessa luz.',
    },
    {
      kicker: 'DIÁRIO DE CAMPO',
      headline: 'Nenhuma expedição é igual à anterior.',
      body: 'Os rolos reorganizam as pistas a cada tentativa. O templo recompensa quem continua procurando.',
    },
    {
      kicker: 'ANTES DO PRÓXIMO GIRO',
      headline: 'Escute a selva. Depois, siga os símbolos.',
      body: 'O caminho pode parecer silencioso agora, mas as ruínas nunca ficam quietas por muito tempo.',
    },
  ],
  busy: [
    {
      kicker: 'O TEMPLO DESPERTA',
      headline: 'As engrenagens antigas voltaram a se mover.',
      body: 'Os símbolos atravessam as câmaras enquanto a expedição procura uma nova combinação.',
    },
    {
      kicker: 'ROTA EM MOVIMENTO',
      headline: 'As paredes parecem mudar de lugar diante dos seus olhos.',
      body: 'Mantenha a atenção nos rolos. O templo está escolhendo qual caminho revelar desta vez.',
    },
    {
      kicker: 'SÍMBOLOS EM CURSO',
      headline: 'A próxima pista está se formando agora.',
      body: 'Relíquias passam rápido pelas janelas do templo. Quando tudo parar, um novo fragmento da história poderá surgir.',
    },
    {
      kicker: 'PULSO ESMERALDA',
      headline: 'A energia cresce à medida que os rolos avançam.',
      body: 'Cada parada aproxima a expedição de uma resposta. Espere o último símbolo encontrar seu lugar.',
    },
    {
      kicker: 'MECANISMO ANCESTRAL',
      headline: 'Algo antigo está alinhando as relíquias.',
      body: 'O templo não entrega seus segredos de uma só vez. Primeiro ele gira, depois observa, então decide o que mostrar.',
    },
    {
      kicker: 'PASSAGEM INSTÁVEL',
      headline: 'As ruínas estão reorganizando o caminho.',
      body: 'As colunas se movem, os símbolos descem e a expedição espera o momento exato em que tudo finalmente se encaixa.',
    },
  ],
  miss: [
    {
      kicker: 'CAMINHO FECHADO',
      headline: 'Desta vez, as ruínas permaneceram em silêncio.',
      body: 'Nem toda passagem se abre de imediato. A raposa registra o caminho e se prepara para uma nova tentativa.',
    },
    {
      kicker: 'NENHUMA RELÍQUIA',
      headline: 'Os símbolos não revelaram um tesouro desta vez.',
      body: 'O templo continua mudando. Um novo giro pode reorganizar as pistas e abrir outra rota pela expedição.',
    },
    {
      kicker: 'PISTA PERDIDA',
      headline: 'A trilha terminou antes da câmara secreta.',
      body: 'A busca não acabou. Há outros sinais nas paredes e novas combinações esperando para surgir.',
    },
    {
      kicker: 'SILÊNCIO NAS RUÍNAS',
      headline: 'Nenhum prêmio apareceu nesta passagem.',
      body: 'A expedição segue adiante. Às vezes, a próxima descoberta está escondida logo depois de um caminho vazio.',
    },
  ],
  win: [
    {
      kicker: 'RELÍQUIA ENCONTRADA',
      headline: 'As ruínas entregaram um novo tesouro.',
      body: 'Os símbolos se alinharam e uma peça esquecida voltou à luz. Ainda existem muitas câmaras para explorar.',
    },
    {
      kicker: 'DESCOBERTA CONFIRMADA',
      headline: 'Um fragmento do passado acaba de reaparecer.',
      body: 'A relíquia carrega marcas de uma civilização que desapareceu sem deixar respostas. Talvez o próximo giro revele mais.',
    },
    {
      kicker: 'SINAL FAVORÁVEL',
      headline: 'O templo respondeu à expedição.',
      body: 'Uma combinação abriu espaço entre as pedras e trouxe uma nova descoberta. O caminho adiante parece mais promissor.',
    },
    {
      kicker: 'ACHADO DE CAMPO',
      headline: 'Mais uma relíquia foi retirada das sombras.',
      body: 'Pequenas descobertas constroem grandes histórias. Continue avançando e reúna novas pistas sobre o templo perdido.',
    },
    {
      kicker: 'PORTA ENTREABERTA',
      headline: 'A vitória revelou mais do que créditos.',
      body: 'Por um instante, inscrições antigas ficaram visíveis nas paredes. A expedição pode estar chegando perto de algo maior.',
    },
    {
      kicker: 'TRILHA CORRETA',
      headline: 'Os símbolos apontaram na mesma direção.',
      body: 'Uma nova peça da jornada foi encontrada. O templo ainda guarda segredos suficientes para muitas outras expedições.',
    },
  ],
  big: [
    {
      kicker: 'TESOURO RARO',
      headline: 'Uma descoberta digna das lendas.',
      body: 'A energia do templo se intensifica. Relíquias desse nível quase nunca chegam à superfície intactas.',
    },
    {
      kicker: 'CÂMARA RARA',
      headline: 'As ruínas abriram uma passagem que poucos encontrariam.',
      body: 'O brilho dourado atravessa a selva e revela um tesouro preservado por gerações. A expedição acaba de mudar de escala.',
    },
    {
      kicker: 'ARQUIVO PERDIDO',
      headline: 'Esta descoberta não aparece nos mapas.',
      body: 'Os símbolos revelaram uma peça rara, cercada de inscrições e energia esmeralda. Há sinais de algo ainda maior adiante.',
    },
    {
      kicker: 'RITUAL DESPERTO',
      headline: 'O templo reconheceu a combinação.',
      body: 'A luz percorre as colunas como se a estrutura inteira tivesse voltado à vida por alguns instantes.',
    },
    {
      kicker: 'TESOURO DO SANTUÁRIO',
      headline: 'Uma relíquia rara emergiu das câmaras internas.',
      body: 'A expedição encontrou algo que parecia existir apenas nas histórias contadas ao redor das fogueiras.',
    },
    {
      kicker: 'MARCO DA EXPEDIÇÃO',
      headline: 'Este achado vai para a primeira página do diário.',
      body: 'Poucas combinações despertam uma resposta tão forte das ruínas. O templo claramente ainda não mostrou tudo.',
    },
  ],
  grand: [
    {
      kicker: 'RELÍQUIA LENDÁRIA',
      headline: 'O coração do templo foi revelado.',
      body: 'Uma força ancestral desperta entre as pedras. A expedição acaba de alcançar uma descoberta extraordinária.',
    },
    {
      kicker: 'SEGREDO ANCESTRAL',
      headline: 'A lenda era verdadeira.',
      body: 'No centro das ruínas, uma relíquia impossível de ignorar rompeu séculos de silêncio. Este é o tipo de descoberta que muda uma expedição para sempre.',
    },
    {
      kicker: 'CÂMARA DO CORAÇÃO',
      headline: 'As portas mais antigas finalmente se abriram.',
      body: 'A energia esmeralda tomou o salão inteiro. Tudo indica que esta peça esteve protegida desde os primeiros dias do templo.',
    },
    {
      kicker: 'DESCOBERTA HISTÓRICA',
      headline: 'Você encontrou o tipo de tesouro que vira lenda.',
      body: 'As inscrições brilham, a selva parece parar e o templo reconhece a conquista. Poucos caminhos chegam tão longe.',
    },
    {
      kicker: 'O TEMPLO RESPONDE',
      headline: 'Toda a ruína vibra com a mesma energia.',
      body: 'A combinação perfeita revelou uma relíquia de valor incomum. Ainda assim, há sinais de que o santuário possui camadas mais profundas.',
    },
    {
      kicker: 'CAPÍTULO LENDÁRIO',
      headline: 'Esta é uma história que merece ser contada novamente.',
      body: 'Entre pedra, selva e luz esmeralda, a expedição encontrou uma recompensa reservada aos caminhos mais raros.',
    },
  ],
};

export function storySeed(value: string | undefined, length: number) {
  if (!value || length <= 1) return 0;
  let hash = 0;
  for (const char of value) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return hash % length;
}
