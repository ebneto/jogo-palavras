// src/components/Game.tsx

import React, { useEffect, useState, useRef } from 'react';

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
  const [tempoRestante, setTempoRestante] = useState(40); // tempo inicial
  const [desativado, setDesativado] = useState(false); // desativa input/botões se tempo acabar
  const [jogoFinalizado, setJogoFinalizado] = useState(false);
  const [nivel, setNivel] = useState<'facil' | 'dificil'>('facil');
  const [palavrasRestantes, setPalavrasRestantes] = useState<string[]>([...palavrasFaceis]);
  const [pontos, setPontos] = useState(0);
  const [ranking, setRanking] = useState<any[]>([]);
  const pontuacaoSalva = useRef(false);
  const [pulosRestantes, setPulosRestantes] = useState(3);


  // Função para salvar no backend (AWS API Gateway + Lambda + DynamoDB)
  async function salvarPontuacaoFinal(nome: string, pontos: number) {
    try {
      const resposta = await fetch("https://4057ymgor1.execute-api.us-east-1.amazonaws.com/salvar-pontuacao", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: crypto.randomUUID(),
          nome,
          pontos,
          data: new Date().toISOString(), // opcional
        }),
      });
  
      if (!resposta.ok) {
        throw new Error("Erro ao salvar pontuação.");
      }
  
      console.log("Pontuação salva com sucesso!");
    } catch (erro) {
      console.error("Erro ao salvar pontuação:", erro);
    }
  }

  useEffect(() => {
    async function carregarRanking() {
      const res = await fetch("https://4057ymgor1.execute-api.us-east-1.amazonaws.com/ranking");
      const dados = await res.json();
      setRanking(dados);
    }
  
    carregarRanking();
  }, []);


  function reiniciarJogo() {
    setNivel('facil');
    setPalavrasRestantes([...palavrasFaceis]);
    setPontos(0);
    setTempoRestante(40);
    setMensagem('');
    setResposta('');
    setDesativado(false);
    setJogoFinalizado(false);
    
    carregarNovaPalavra(palavrasFaceis); // 👈 força a lista correta
  }


  // Carrega uma nova palavra aleatória
  function carregarNovaPalavra(lista?: string[]) {
    let novasPalavras = lista ? [...lista] : [...palavrasRestantes];
    pontuacaoSalva.current = false;
  
    if (novasPalavras.length === 0) {
      if (nivel === 'facil') {
        novasPalavras = [...palavrasDificeis];
        setNivel('dificil');
      } else {
        setMensagem('🏁 Fim do jogo! Parabéns!');
        if (pontos != 0) { 
          console.log("Pontuação > 0");
          salvarPontuacaoFinal(nome, pontos);
        }
        setDesativado(true);
        setJogoFinalizado(true);
        return;
      }
    }
  
    const indice = Math.floor(Math.random() * novasPalavras.length);
    const palavra = novasPalavras[indice];
  
    novasPalavras.splice(indice, 1);
    setPalavrasRestantes(novasPalavras);
    setPalavraOriginal(palavra);
    setPalavraEmbaralhada(embaralhar(palavra));
    setResposta('');
    setMensagem('');
    setDesativado(false);
    setJogoFinalizado(false);
    
    // Só reinicia o tempo depois que tudo estiver setado
    setTimeout(() => {
      setTempoRestante(40);
    }, 0);
  }

  // Pula para a próxima palavra subtraindo o contador de pulos restantes
  function pularPalavra() {
    if (pulosRestantes > 0 && resposta.trim() === "") {
      setPulosRestantes((prev) => prev - 1);
      carregarNovaPalavra();
    }
    else if (pulosRestantes > 0 && !verificarResposta()) {
      setPulosRestantes((prev) => prev - 1);
      carregarNovaPalavra();
    }
  }


  // Executa uma vez quando o componente for carregado
  useEffect(() => {
    carregarNovaPalavra();
  }, []);

  // Reduz o tempo a cada segundo
  useEffect(() => {
    if (jogoFinalizado || desativado) return;
  
    const palavraAtual = palavraOriginal; // captura localmente
    const intervalo = setInterval(() => {
      setTempoRestante((tempoAtual) => {
        if (tempoAtual <= 1) {
          clearInterval(intervalo); // para o timer imediatamente
          setDesativado(true);
          setJogoFinalizado(true);
          setMensagem(`⏰ Tempo esgotado! A palavra era "${palavraAtual}"`);
          
          if (!pontuacaoSalva.current) {
            if (pontos != 0) { 
              console.log("Pontuação > 0");
              salvarPontuacaoFinal(nome, pontos);
            }
            pontuacaoSalva.current = true;
          }
          return 0;
        }
        return tempoAtual - 1;
      });
    }, 1000);
  
    return () => clearInterval(intervalo);
  }, [jogoFinalizado, desativado, palavraOriginal]);

  // Verifica se a resposta do jogador está correta
  function verificarResposta() {
    if (resposta.toLowerCase() === palavraOriginal.toLowerCase()) {
      setMensagem('✅ Acertou!');
      setDesativado(true);
      setPontos(p => p + 1); // Incrementa a pontuação
      carregarNovaPalavra();
      return true;
    } else {
      setMensagem('❌ Tente novamente!');
      return false;
    }
  }


  return (
    <div style={{
      maxWidth: '400px',
      margin: '0 auto',
      padding: '1rem',
      textAlign: 'center',
      fontFamily: 'Arial, sans-serif'
    }}>
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

      <div style={{
        fontSize: '2rem',
        letterSpacing: '4px',
        marginBottom: '1rem',
        fontWeight: 'bold'
      }}>
        {palavraEmbaralhada}
      </div>

      <input
        type="text"
        value={resposta}
        onChange={(e) => setResposta(e.target.value)}
        placeholder="Digite aqui"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            if (!desativado) {
              verificarResposta();
            } else if (!jogoFinalizado && pulosRestantes > 0 && resposta.trim() === '') {
              carregarNovaPalavra();
            }
          }
        }}
        disabled={desativado}
        style={{
          padding: '0.5rem',
          width: '100%',
          marginBottom: '0.75rem',
          fontSize: '1rem'
        }}
      />
      <button
        onClick={verificarResposta}
        disabled={desativado}
        style={{
          padding: '0.6rem',
          width: '100%',
          backgroundColor: desativado ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          marginBottom: '0.5rem',
          fontSize: '1rem',
          cursor: desativado ? 'not-allowed' : 'pointer'
        }}
      >
        Verificar
      </button>

      <button
        onClick={() => pularPalavra()}
        disabled={pulosRestantes === 0 || jogoFinalizado}
        style={{
          padding: '0.6rem',
          width: '100%',
          backgroundColor: pulosRestantes === 0 || jogoFinalizado ? '#ccc' : '#28a745',
          color: pulosRestantes === 0 || jogoFinalizado ? '#666' : '#fff',
          border: 'none',
          borderRadius: '5px',
          marginBottom: '0.5rem',
          fontSize: '1rem',
          cursor: pulosRestantes === 0 || jogoFinalizado ? 'not-allowed' : 'pointer'
        }}
      >
        Pular palavra ({pulosRestantes} restante{pulosRestantes !== 1 ? 's' : ''})
      </button>

      {mensagem && (
        <div style={{
          marginTop: '0.75rem',
          fontWeight: 'bold',
          color: mensagem.toLowerCase().includes('acertou') ? 'green' : 'red',
          transition: 'opacity 0.3s ease'
        }}>
          {mensagem}
        </div>
      )}

      {jogoFinalizado && (
        <button
          onClick={reiniciarJogo}
          style={{
            marginTop: '1rem',
            padding: '0.6rem',
            width: '100%',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            fontSize: '1rem',
            cursor: 'pointer'
          }}
        >
          🔄 Jogar Novamente
        </button>
      )}

      <div style={{ marginTop: '2rem' }}>
        <h3>🏅 Veja o Ranking</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {ranking.map((item, index) => (
            <li key={index} style={{ marginBottom: '0.5rem' }}>
              {item.nome} - {item.pontos} pts - {new Date(item.data).toLocaleString()}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Game;
