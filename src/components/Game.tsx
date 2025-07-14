// src/components/Game.tsx

import React, { useEffect, useState } from 'react';
import Ranking from './Ranking';

// Lista de palavras (temporariamente fixas, depois vamos carregar da AWS)
const palavrasFaceis = ['carro', 'nuvem', 'livro', 'piano', 'pessoa'];
const palavrasDificeis = ['computador', 'apontador', 'geladeira', 'eletricidade', 'avenida', 'encomenda'];

// Função para embaralhar as letras de uma palavra
function embaralhar(palavra: string): string {
  if (palavra.length <= 1) return palavra;

  let embaralhada = palavra;

  // Embaralha até que fique diferente da original ou atinja o limite de tentativas
  for (let tentativas = 0; tentativas < 10; tentativas++) {
    embaralhada = palavra
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');

    if (embaralhada !== palavra) break;
  }

  return embaralhada;
}


interface GameProps {
  nome: string;
}

const Game: React.FC<GameProps> = ({ nome }) => {
  // Estados do jogo
  const [palavraOriginal, setPalavraOriginal] = useState('');
  const [palavraEmbaralhada, setPalavraEmbaralhada] = useState('');
  const [resposta, setResposta] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [tempoRestante, setTempoRestante] = useState(20); // tempo inicial
  const [desativado, setDesativado] = useState(false); // desativa input/botões se tempo acabar
  const [jogoFinalizado, setJogoFinalizado] = useState(false);
  const [nivel, setNivel] = useState<'facil' | 'dificil'>('facil');
  const [palavrasRestantes, setPalavrasRestantes] = useState<string[]>([...palavrasFaceis]);
  const [pontos, setPontos] = useState(0);


function salvarPontuacaoFinal(nome: string, pontos: number) {
    console.log("Pontuação salva:", nome, pontos);

    const historicoString = localStorage.getItem('historicoPontuacoes');
    let historico: { nome: string; pontos: number; data: string }[] = [];
    
    if (historicoString) {
      try {
        historico = JSON.parse(historicoString);
      } catch (e) {
        console.error('Erro ao ler histórico do localStorage:', e);
        historico = [];
      }
    }
  
    historico.push({
      nome,
      pontos,
      data: new Date().toLocaleString(),
    });
  
    localStorage.setItem('historicoPontuacoes', JSON.stringify(historico));
  }

  function reiniciarJogo() {
    setNivel('facil');
    setPalavrasRestantes([...palavrasFaceis]);
    setPontos(0);
    setTempoRestante(30);
    setMensagem('');
    setResposta('');
    setDesativado(false);
    setJogoFinalizado(false);
    
    carregarNovaPalavra(); // Inicia nova rodada
  }


  // Carrega uma nova palavra aleatória
  function carregarNovaPalavra() {
    let novasPalavras = [...palavrasRestantes];

  if (novasPalavras.length === 0) {
    if (nivel === 'facil') {
      // Passa para o nível difícil
      novasPalavras = [...palavrasDificeis];
      setNivel('dificil');
    } else {
      // Se acabou até as difíceis, reinicia o jogo ou finaliza
      setMensagem('🏁 Fim do jogo! Parabéns!');
      salvarPontuacaoFinal(nome, pontos);
      setDesativado(true);
      setJogoFinalizado(true);
      return;
    }
  }

  const indice = Math.floor(Math.random() * novasPalavras.length);
  const palavra = novasPalavras[indice];

  novasPalavras.splice(indice, 1); // Remove a palavra já usada
  setPalavrasRestantes(novasPalavras);

  setPalavraOriginal(palavra);
  setPalavraEmbaralhada(embaralhar(palavra));
  setResposta('');
  setMensagem('');
  setTempoRestante(30);
  setDesativado(false);
  setJogoFinalizado(false);
}



  // Executa uma vez quando o componente for carregado
  useEffect(() => {
    carregarNovaPalavra();
  }, []);

  // Reduz o tempo a cada segundo
  useEffect(() => {
    if (tempoRestante <= 0 || jogoFinalizado) {
      if (tempoRestante <= 0) {
        setMensagem(`⏰ Tempo esgotado! A palavra era "${palavraOriginal}"`);
        setDesativado(true);
        setJogoFinalizado(true);
        salvarPontuacaoFinal(nome, pontos); // salva a pontuação atual
    }
      return;
    }

    const intervalo = setInterval(() => {
      setTempoRestante((tempo) => tempo - 1);
    }, 1000);

    return () => clearInterval(intervalo);
  }, [tempoRestante, jogoFinalizado]);


  // Verifica se a resposta do jogador está correta
  function verificarResposta() {
    if (resposta.toLowerCase() === palavraOriginal.toLowerCase()) {
      setMensagem('✅ Acertou!');
      setDesativado(true);
      setPontos(p => p + 1); // Incrementa a pontuação
    } else {
      setMensagem('❌ Tente novamente!');
    }
  }


  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '1rem', textAlign: 'center' }}>
      <div style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 'bold' }}>
        Jogador: {nome}
      </div>
      <div style={{ marginBottom: '1rem', fontSize: '1rem' }}>
        Nível: {nivel === 'facil' ? 'Fácil' : 'Difícil'} | Pontos: {pontos}
      </div>

      <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Adivinhe a palavra!</h2>

      <div style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>
        Tempo restante: {tempoRestante}s
      </div>

      <div style={{ fontSize: '2rem', letterSpacing: '4px', marginBottom: '1rem' }}>
        {palavraEmbaralhada}
      </div>

      <input
        type="text"
        value={resposta}
        onChange={(e) => setResposta(e.target.value)}
        placeholder="Digite aqui"
        disabled={desativado}
        style={{ padding: '0.5rem', width: '100%', marginBottom: '0.5rem' }}
      />


      <button onClick={verificarResposta} disabled={desativado} style={{ padding: '0.5rem 1rem' }}>
        Verificar
      </button>

      {mensagem && <div style={{ marginTop: '1rem', fontWeight: 'bold' }}>{mensagem}</div>}

      <button onClick={carregarNovaPalavra} style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'blue' }}>
        Próxima palavra
      </button>

      {jogoFinalizado && (
        <button
          onClick={reiniciarJogo}
          style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}
        >
          🔄 Jogar Novamente
        </button>
        )
      }

      <div style={{ marginTop: '2rem' }}>
        <h3>🏅 Veja o Ranking</h3>
        <Ranking />
      </div>

    </div>
  );
};

export default Game;
