// src/components/Ranking.tsx

import React from 'react';

interface Registro {
  nome: string;
  pontos: number;
  data: string;
}

const Ranking: React.FC = () => {
  const historicoString = localStorage.getItem('historicoPontuacoes');
  const historico: Registro[] = historicoString ? JSON.parse(historicoString) : [];

  // Ordena por pontos, do maior para o menor
  const top10 = historico.sort((a, b) => b.pontos - a.pontos).slice(0, 10);

  return (
    <div style={{ maxWidth: '500px', margin: '2rem auto', textAlign: 'center' }}>
      <h2>🏆 Ranking dos Jogadores</h2>
      {top10.length === 0 ? (
        <p>Nenhuma pontuação registrada ainda.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
          <thead>
            <tr>
              <th style={{ borderBottom: '1px solid #ccc' }}>#</th>
              <th style={{ borderBottom: '1px solid #ccc' }}>Nome</th>
              <th style={{ borderBottom: '1px solid #ccc' }}>Pontos</th>
              <th style={{ borderBottom: '1px solid #ccc' }}>Data</th>
            </tr>
          </thead>
          <tbody>
            {top10.map((registro, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>{registro.nome}</td>
                <td>{registro.pontos}</td>
                <td style={{ fontSize: '0.8rem' }}>{registro.data}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Ranking;
