// src/components/Login.tsx

import React, { useState } from 'react';

interface LoginProps {
  onLogin: (nome: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [nome, setNome] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (nome.trim().length === 0) return;

    localStorage.setItem('nomeDoJogador', nome);
    onLogin(nome);
  }

  return (
    <form onSubmit={handleSubmit} style={{ textAlign: 'center', marginTop: '4rem' }}>
      <h2>Bem-vindo ao Jogo de Palavras!</h2>
      <p>Digite seu nome para começar:</p>

      <input
        type="text"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        placeholder="Seu nome"
        style={{ padding: '0.5rem', fontSize: '1rem' }}
      />

      <button type="submit" style={{ padding: '0.5rem 1rem', marginLeft: '1rem' }}>
        Entrar
      </button>
    </form>
  );
};

export default Login;
