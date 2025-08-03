// src/components/Game.tsx

import React, { useEffect, useState, useRef } from 'react';

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
  const [tamanhoPalavraAtual, setTamanhoPalavraAtual] = useState(3);
  const [contadorPalavrasTamanhoAtual, setcontadorPalavrasTamanhoAtual] = useState(0);
  const [resposta, setResposta] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [tempoRestante, setTempoRestante] = useState(40); // tempo inicial
  const [desativado, setDesativado] = useState(false); // desativa input/botões se tempo acabar
  const [jogoFinalizado, setJogoFinalizado] = useState(false);
  const [pontos, setPontos] = useState(0);
  const [ranking, setRanking] = useState<any[]>([]);
  const pontuacaoSalva = useRef(false);
  const [pulosRestantes, setPulosRestantes] = useState(3);
  const [loading, setLoading] = useState(true);
  const [palavrasDisponiveis, setPalavrasDisponiveis] = useState<string[]>([]);
  const [mostrarInstrucoes, setMostrarInstrucoes] = useState(false);
  const [temporizadorAtivo, setTemporizadorAtivo] = useState(true);


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
  }, [jogoFinalizado]);


  function reiniciarJogo() {
    setPontos(0);
    setTempoRestante(40);
    setcontadorPalavrasTamanhoAtual(0);
    setTamanhoPalavraAtual(3);
    setPulosRestantes(3);
    setMensagem('');
    setResposta('');
    setPalavraOriginal('');
    setPalavraEmbaralhada('');
    setDesativado(false);
    setJogoFinalizado(false);
    pontuacaoSalva.current = false;
    carregarNovaPalavraInteligente();
  }

  useEffect(() => {
    async function carregarPalavrasDoS3() {
      try {
        const response = await fetch('https://jogo-palavras-enio.s3.us-east-1.amazonaws.com/base_de_palavras/palavras_filtradas_ptbr_2k.txt');
        const texto = await response.text();

        // Limpa e filtra palavras
        const palavras = texto
          .split('\n')                 // divide por linha
          .map(p => p.trim())          // remove espaços extras
          .filter(p => p.length > 0);  // remove linhas vazias
        setPalavrasDisponiveis(palavras);
        setLoading(false);

      } catch (error) {
        console.error('Erro ao carregar palavras do S3:', error);
      }
    }
    carregarPalavrasDoS3();
  }, []);


  function obterPalavraAleatoria(palavras: string[], tamanho: number): string | null {

    const candidatas = palavras.filter(p => p.length === tamanho);
    if (candidatas.length === 0) return null;

    const indice = Math.floor(Math.random() * candidatas.length);
    return candidatas[indice];
  }


  function carregarNovaPalavraInteligente() {

    if (loading || palavrasDisponiveis.length === 0) {
      console.log("Ainda carregando palavras...");
      return;
    }

    const novaPalavra = obterPalavraAleatoria(palavrasDisponiveis, tamanhoPalavraAtual);

    if (!novaPalavra) {
      setMensagem('🏁 Fim do jogo ou nenhuma palavra com esse tamanho!');
      setDesativado(true);
      setJogoFinalizado(true);
      return;
    }

    setPalavraOriginal(novaPalavra);
    setPalavraEmbaralhada(embaralhar(novaPalavra));
    setResposta('');
    setMensagem('');
    setDesativado(false);
    setJogoFinalizado(false);
    setTempoRestante(40);
  }



  // Pula para a próxima palavra subtraindo o contador de pulos restantes
  function pularPalavra() {
    if (pulosRestantes > 0 && resposta.trim() === "") {
      setPulosRestantes((prev) => prev - 1);
      carregarNovaPalavraInteligente();
    }
    else if (pulosRestantes > 0 && !verificarResposta()) {
      setPulosRestantes((prev) => prev - 1);
      carregarNovaPalavraInteligente();
    }
  }


  // Executa uma vez quando o componente for carregado
  useEffect(() => {
    if (!loading && palavrasDisponiveis.length > 0) {
      carregarNovaPalavraInteligente();
    }
  }, [loading, palavrasDisponiveis]);


  // Reduz o tempo a cada segundo
  useEffect(() => {
    if (!temporizadorAtivo || jogoFinalizado || desativado) return;

    const palavraAtual = palavraOriginal; // captura localmente
    const intervalo = setInterval(() => {
      setTempoRestante((tempoAtual) => {
        if (tempoAtual <= 1) {
          clearInterval(intervalo); // para o timer imediatamente
          setDesativado(true);
          setJogoFinalizado(true);
          setcontadorPalavrasTamanhoAtual(0);
          setTamanhoPalavraAtual(3);
          setPulosRestantes(3);
          setPalavraOriginal('');
          setPalavraEmbaralhada('');
          setMensagem(`⏰ Tempo esgotado! A palavra era "${palavraAtual}"`);

          if (!pontuacaoSalva.current) {
            if (pontos != 0) {
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
  }, [temporizadorAtivo, jogoFinalizado, desativado, palavraOriginal]);

  //Atualiza o contador do tamanho da palavra
  useEffect(() => {
    if (contadorPalavrasTamanhoAtual >= 8) {
      console.log("⏩ passando para palavras maiores");
      setTamanhoPalavraAtual(t => t + 1);
      setcontadorPalavrasTamanhoAtual(0);
    }
  }, [contadorPalavrasTamanhoAtual]);

  // Verifica se a resposta do jogador está correta
  function verificarResposta() {
    if (resposta.toLowerCase() === palavraOriginal.toLowerCase()) {
      setMensagem('✅ Acertou!');
      setDesativado(true);
      setPontos(p => p + 1); // Incrementa a pontuação

      // Atualiza contador
      setcontadorPalavrasTamanhoAtual(c => c + 1);
      setTimeout(() => {
        carregarNovaPalavraInteligente();
      }, 0);
      return true;
    } else {
      setMensagem('❌ Tente novamente!');
      return false;
    }
  }
  {
    mostrarInstrucoes && (
      <div style={{
        position: 'fixed',
        top: 0, left: 0,
        width: '100%', height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '10px',
          maxWidth: '400px',
          textAlign: 'left',
          boxShadow: '0 0 10px rgba(0,0,0,0.3)'
        }}>
          <h2>📘 Como jogar</h2>
          <p>Você verá uma palavra embaralhada. Digite a forma correta e pressione Enter ou clique em Verificar.</p>
          <p>Você pode pular palavras até 3 vezes. As palavras começam com 3 letras e vão aumentando conforme você acerta.</p>
          <p>O tempo para cada palavra é de 40 segundos.</p>
          <button
            onClick={() => setMostrarInstrucoes(false)}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Fechar
          </button>
        </div>
      </div>
    )
  }


  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '1rem', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
      {/* MODAL DENTRO DO JSX */}
      {mostrarInstrucoes && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0,
          width: '100%', height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '10px',
            maxWidth: '400px',
            textAlign: 'left',
            boxShadow: '0 0 10px rgba(0,0,0,0.3)'
          }}>
            <h2>📘 Como jogar</h2>
            <p>Você verá uma palavra embaralhada. Digite a forma correta e pressione Enter ou clique em Verificar.</p>
            <p>Você pode pular palavras até 3 vezes. As palavras começam com 3 letras e vão aumentando conforme você acerta.</p>
            <p>O tempo para cada palavra é de 40 segundos.</p>
            <button
              onClick={() => {
                setMostrarInstrucoes(false);
                setTemporizadorAtivo(true);
              }}
              style={{
                marginTop: '1rem',
                padding: '0.5rem 1rem',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Fechar
            </button>
          </div>
        </div>
      )}
      {loading ? (
        <p style={{ fontSize: '1.2rem' }}>Carregando palavras...</p>
      ) : (
        <>
          <button
            onClick={() => {
              setMostrarInstrucoes(true);
              setTemporizadorAtivo(false);
            }}
            style={{
              marginBottom: '1rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            ℹ️ Instruções
          </button>

          <div style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 'bold' }}>
            Jogador: {nome} | Pontos: {pontos}
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
            <ul style={{
              listStyle: 'none',
              padding: 0,
              maxHeight: '200px',      // altura máxima
              overflowY: 'auto',        // rolagem vertical
              border: '1px solid #ccc', // só para visual
              borderRadius: '4px',
              marginTop: '0.5rem'
            }}>
              {ranking.map((item, index) => (
                <li key={index} style={{ padding: '0.25rem 0' }}>
                  {item.nome} - {item.pontos} pts - {new Date(item.data).toLocaleString()}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default Game;