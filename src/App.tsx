import { useState, useEffect } from 'react';
import Login from './components/Login';
import Game from './components/Game';

function App() {
  const [nomeDoJogador, setNomeDoJogador] = useState<string | null>(null);

  // Ao carregar a página, tenta recuperar o nome salvo
  useEffect(() => {
    const nomeSalvo = localStorage.getItem('nomeDoJogador');
    if (nomeSalvo) {
      setNomeDoJogador(nomeSalvo);
    }
  }, []);

  // Exibe o componente certo com base no estado
  return (
    <div style={{ backgroundColor: '#f2f2f2', minHeight: '100vh' }}>
      {nomeDoJogador ? (
        <Game nome={nomeDoJogador} />
      ) : (
        <Login onLogin={setNomeDoJogador} />
      )}
    </div>
  );
}

export default App;
