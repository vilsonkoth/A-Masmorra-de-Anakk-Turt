import React, { useState } from 'react';
import { X, BookOpen, Swords, Dices, Shield, Skull, Coins, Flame, Layers } from 'lucide-react';

interface RulebookModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulebookModal: React.FC<RulebookModalProps> = ({ isOpen, onClose }) => {
  const [activeSection, setActiveSection] = useState<'OVERVIEW' | 'TURNS' | 'COMBAT' | 'DECK' | 'GLOSSARY'>('OVERVIEW');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="playmat-surface border-2 border-[#d4af37] rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-[0_0_50px_rgba(212,175,55,0.35)] overflow-hidden card-3d">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#3d2e22] flex items-center justify-between bg-[#140e0b]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-[#2a1d15] to-[#140e0a] border border-[#d4af37]/60 flex items-center justify-center text-[#d4af37] shadow">
              <BookOpen size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-amber-100 font-cinzel uppercase tracking-wider">
                LIVRO DE REGRAS OFICIAIS
              </h2>
              <p className="text-xs text-amber-200/70 font-mono">
                A Masmorra de Anakk Tur — Guia Completo de Regras e Efeitos
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-amber-200/60 hover:text-white p-2 rounded-lg bg-[#1a140f] border border-[#3d2e22] transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#3d2e22] bg-[#120e0b] px-4 sm:px-6 gap-2 overflow-x-auto scrollbar-none">
          {[
            { id: 'OVERVIEW', label: 'Visão Geral & Limites', icon: <Shield size={14} /> },
            { id: 'TURNS', label: 'Estrutura do Turno', icon: <Swords size={14} /> },
            { id: 'COMBAT', label: 'Combate & Reação', icon: <Dices size={14} /> },
            { id: 'DECK', label: 'Deck da Masmorra', icon: <Layers size={14} /> },
            { id: 'GLOSSARY', label: 'Glossário de Efeitos', icon: <Flame size={14} /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              className={`py-3.5 px-3 sm:px-4 text-xs font-black font-cinzel uppercase tracking-wider border-b-2 transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeSection === tab.id
                  ? 'border-[#d4af37] text-yellow-400'
                  : 'border-transparent text-amber-200/50 hover:text-amber-100'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs text-amber-100/90 leading-relaxed scrollbar-thin">
          {activeSection === 'OVERVIEW' && (
            <div className="space-y-4">
              <div className="bg-[#140e0b] p-4 rounded-2xl border border-[#3d2e22] space-y-2 card-3d">
                <h3 className="text-sm font-black text-yellow-400 font-cinzel uppercase tracking-wider flex items-center gap-2">
                  <Coins size={16} className="text-yellow-400" /> Objetivo & Componentes
                </h3>
                <p>
                  <strong>A Masmorra de Anakk Tur</strong> é um cardgame competitivo de 2 a 6 jogadores ambientado nas profundezas de uma perigosa masmorra. Seu objetivo é derrotar monstros, pilhar tesouros e sabotar outros aventureiros.
                </p>
                <ul className="list-disc pl-5 space-y-1 text-amber-200/70 mt-2 font-mono">
                  <li><strong>Deck de Saqueadores:</strong> 60 cartas divididas entre Combatentes, Conjuradores e Feras.</li>
                  <li><strong>Deck de Masmorra:</strong> 50 cartas montadas em ordem crescente de perigo até o temido Chefe de Nível 3.</li>
                  <li><strong>Dados de Combate (6 faces):</strong> Indicam Acertos (Dano) ou Nulos (geradores de Reação).</li>
                  <li><strong>Marcadores de Dano & Tesouro:</strong> Para registrar ferimentos e ouro acumulado.</li>
                </ul>
              </div>

              <div className="bg-[#140e0b] p-4 rounded-2xl border-2 border-red-800/80 space-y-2 card-3d">
                <h3 className="text-sm font-black text-red-400 font-cinzel uppercase tracking-wider flex items-center gap-2">
                  <Skull size={16} className="text-red-400" /> Limite de Saqueadores em Campo (Máximo 4)
                </h3>
                <p>
                  Cada jogador pode manter no seu lado do tabuleiro no <strong>máximo 4 saqueadores</strong> simultaneamente. Se decidir jogar o 5º saqueador da mão, deverá <strong>escolher 1 dos seus saqueadores em campo para ser destruído imediatamente</strong>. Se o destruído possuir <em>Último Suspiro</em>, seu efeito é disparado.
                </p>
              </div>

              <div className="bg-[#140e0b] p-4 rounded-2xl border border-[#3d2e22] space-y-2 card-3d">
                <h3 className="text-sm font-black text-amber-100 font-cinzel uppercase tracking-wider">
                  Mão Inicial
                </h3>
                <p>
                  Para balancear a vantagem do primeiro turno:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-amber-200/70 font-mono">
                  <li>O <strong>1º jogador</strong> inicia com <strong>4 cartas</strong> na mão.</li>
                  <li>Os <strong>demais jogadores</strong> iniciam com <strong>5 cartas</strong> na mão.</li>
                </ul>
              </div>
            </div>
          )}

          {activeSection === 'TURNS' && (
            <div className="space-y-3 font-mono">
              <div className="bg-[#140e0b] p-3.5 rounded-2xl border border-[#d4af37]/60 space-y-1 card-3d">
                <div className="text-yellow-400 font-black font-cinzel text-xs flex items-center gap-1.5 uppercase">
                  <span className="w-5 h-5 rounded-full btn-fantasy-gold flex items-center justify-center text-[11px] text-black font-black">1</span>
                  PASSO 1: PREPARAR!
                </div>
                <p className="text-amber-100/90 pl-6 text-xs font-sans">
                  O jogador da vez escolhe uma das duas opções: <strong>Comprar 1 carta de saqueador</strong> do deck OU <strong>jogar 1 carta da mão</strong> para o campo.
                </p>
              </div>

              <div className="bg-[#140e0b] p-3.5 rounded-2xl border border-red-800/80 space-y-1 card-3d">
                <div className="text-red-400 font-black font-cinzel text-xs flex items-center gap-1.5 uppercase">
                  <span className="w-5 h-5 rounded-full bg-red-950 border border-red-600 flex items-center justify-center text-[11px] text-red-300 font-black">2</span>
                  PASSO 2: MASMORRA!
                </div>
                <p className="text-amber-100/90 pl-6 text-xs font-sans">
                  Cada saqueador do jogador pode executar <strong>1 ação</strong> durante esta fase:
                </p>
                <ul className="list-disc pl-11 space-y-1 text-amber-200/70 text-xs font-sans">
                  <li>Atacar o monstro atualmente revelado na Masmorra.</li>
                  <li>Usar habilidades ativas especiais.</li>
                  <li>Atacar saqueadores de outros jogadores. <span className="text-yellow-400 font-bold">(Se o oponente tiver algum saqueador com a palavra-chave DEFENSOR, ele deve ser atacado primeiro!)</span></li>
                </ul>
              </div>

              <div className="bg-[#140e0b] p-3.5 rounded-2xl border border-cyan-800/60 space-y-1 card-3d">
                <div className="text-cyan-400 font-black font-cinzel text-xs flex items-center gap-1.5 uppercase">
                  <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-600 flex items-center justify-center text-[11px] text-cyan-300 font-black">3</span>
                  PASSO 3: REAGRUPAR!
                </div>
                <p className="text-amber-100/90 pl-6 text-xs font-sans">
                  O jogador da vez escolhe novamente: <strong>Comprar 1 carta de saqueador</strong> OU <strong>jogar 1 carta da mão</strong> para o campo.
                </p>
              </div>

              <div className="bg-[#140e0b] p-3.5 rounded-2xl border border-[#3d2e22] space-y-1 card-3d">
                <div className="text-amber-200 font-black font-cinzel text-xs flex items-center gap-1.5 uppercase">
                  <span className="w-5 h-5 rounded-full bg-[#1a140f] border border-[#3d2e22] flex items-center justify-center text-[11px] text-amber-200 font-black">4</span>
                  FIM DE TURNO
                </div>
                <p className="text-amber-200/60 pl-6 text-xs font-sans">
                  Passa a vez para o próximo jogador em sentido horário. Ao final de uma rodada completa (todos os jogadores jogaram), ativam-se os efeitos marcados como <em>"NO FINAL DE CADA RODADA"</em>.
                </p>
              </div>
            </div>
          )}

          {activeSection === 'COMBAT' && (
            <div className="space-y-4">
              <div className="bg-[#140e0b] p-4 rounded-2xl border border-[#d4af37]/60 space-y-2 card-3d">
                <h3 className="text-sm font-black text-yellow-400 font-cinzel uppercase tracking-wider flex items-center gap-2">
                  <Dices size={16} className="text-yellow-400" /> Rolagem de Dados e Aplicação de Dano
                </h3>
                <p>
                  Ao atacar, o saqueador rola o número de dados indicado em sua carta (mais bônus de Vínculo, caso aplicável).
                </p>
                <div className="grid grid-cols-2 gap-3 pt-2 font-mono">
                  <div className="bg-[#1e150f] p-3 rounded-xl border border-red-800/80">
                    <div className="font-black text-red-300 flex items-center gap-1">⚔️ Acerto (Dano)</div>
                    <p className="text-[11px] text-amber-200/70 mt-1 font-sans">Aplica 1 marcador de dano no alvo para cada resultado de ataque bem-sucedido.</p>
                  </div>
                  <div className="bg-[#1e150f] p-3 rounded-xl border border-[#d4af37]/60">
                    <div className="font-black text-yellow-400 flex items-center gap-1">💨 Nulo (Em Branco)</div>
                    <p className="text-[11px] text-amber-200/70 mt-1 font-sans">Gera potencial de REAÇÃO caso o alvo sobreviva ao golpe!</p>
                  </div>
                </div>
              </div>

              <div className="bg-[#140e0b] p-4 rounded-2xl border border-red-800/80 space-y-2 card-3d">
                <h3 className="text-sm font-black text-red-400 font-cinzel uppercase tracking-wider flex items-center gap-2">
                  <Skull size={16} className="text-red-400" /> Resolução da Reação
                </h3>
                <ul className="list-disc pl-5 space-y-1.5 text-amber-100/90">
                  <li>
                    <strong>Alvo Sobreviveu:</strong> Se o alvo NÃO for derrotado (Dano &lt; HP), ele causa <strong>1 de dano de reação ao atacante para CADA resultado em branco/nulo</strong> da rolagem!
                  </li>
                  <li>
                    <strong>Alvo Derrotado:</strong> Se o total de marcadores de dano igualar ou superar a vida do alvo, ele é destruído imediatamente e <strong>NÃO causa nenhum dano de reação</strong>!
                  </li>
                  <li>
                    <strong>Recompensa de Tesouros:</strong> O atacante recebe a quantidade de marcadores de tesouro indicada na carta derrotada.
                  </li>
                  <li>
                    <strong>Substituição da Masmorra:</strong> Quando um monstro é derrotado, a próxima câmara da Masmorra é revelada imediatamente.
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeSection === 'DECK' && (
            <div className="space-y-4">
              <div className="bg-[#140e0b] p-4 rounded-2xl border border-[#3d2e22] space-y-3 card-3d">
                <h3 className="text-sm font-black text-yellow-400 font-cinzel uppercase tracking-wider flex items-center gap-2">
                  <Layers size={16} className="text-yellow-400" /> Montagem Oficial do Baralho da Masmorra
                </h3>
                <p>
                  O baralho da Masmorra é empilhado estritamente nesta ordem (de baixo para cima):
                </p>

                <div className="space-y-2 pt-1 font-mono">
                  <div className="bg-[#1e150f] p-3 rounded-xl border border-[#d4af37]/60 flex items-center justify-between">
                    <span className="font-black text-yellow-400">1. Topo do Deck (Câmaras Iniciais)</span>
                    <span className="text-amber-200/60">5x Monstros de Nível 1</span>
                  </div>
                  <div className="bg-[#1e150f] p-3 rounded-xl border border-[#3d2e22] flex items-center justify-between">
                    <span className="font-black text-cyan-400">2. Evento Intermediário</span>
                    <span className="text-amber-200/60">1x Carta de Evento Aleatória</span>
                  </div>
                  <div className="bg-[#1e150f] p-3 rounded-xl border border-[#3d2e22] flex items-center justify-between">
                    <span className="font-black text-purple-400">3. Câmaras Profundas</span>
                    <span className="text-amber-200/60">3x Monstros de Nível 2 (Embaralhados)</span>
                  </div>
                  <div className="bg-[#1e150f] p-3 rounded-xl border border-[#3d2e22] flex items-center justify-between">
                    <span className="font-black text-cyan-400">4. Evento das Catacumbas</span>
                    <span className="text-amber-200/60">1x Carta de Evento Aleatória</span>
                  </div>
                  <div className="bg-[#1e150f] p-3.5 rounded-xl border-2 border-red-700 flex items-center justify-between">
                    <span className="font-black text-red-300">5. Base do Deck (Câmara do Chefe)</span>
                    <span className="font-black text-yellow-400">1x Monstro Nível 3 (Anakk Tur)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'GLOSSARY' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono">
              <div className="bg-[#140e0b] p-3.5 rounded-2xl border border-[#3d2e22] space-y-1 card-3d">
                <div className="font-black text-yellow-400 font-cinzel text-xs flex items-center gap-1 uppercase">
                  ✨ ADENTRAR
                </div>
                <p className="text-[11px] text-amber-200/70 font-sans">
                  Ativa seu efeito imediatamente assim que a carta entra em jogo no campo de batalha.
                </p>
              </div>

              <div className="bg-[#140e0b] p-3.5 rounded-2xl border border-[#3d2e22] space-y-1 card-3d">
                <div className="font-black text-purple-400 font-cinzel text-xs flex items-center gap-1 uppercase">
                  💀 ULTIMO SUSPIRO
                </div>
                <p className="text-[11px] text-amber-200/70 font-sans">
                  Ativa seu efeito quando a carta é destruída e enviada ao descarte ou cemitério.
                </p>
              </div>

              <div className="bg-[#140e0b] p-3.5 rounded-2xl border border-[#3d2e22] space-y-1 card-3d">
                <div className="font-black text-blue-400 font-cinzel text-xs flex items-center gap-1 uppercase">
                  🛡️ DEFENSOR
                </div>
                <p className="text-[11px] text-amber-200/70 font-sans">
                  Deve ser atacado obrigatoriamente antes de qualquer outro saqueador no mesmo campo de batalha.
                </p>
              </div>

              <div className="bg-[#140e0b] p-3.5 rounded-2xl border border-[#3d2e22] space-y-1 card-3d">
                <div className="font-black text-emerald-400 font-cinzel text-xs flex items-center gap-1 uppercase">
                  🌙 NO FINAL DE CADA RODADA
                </div>
                <p className="text-[11px] text-amber-200/70 font-sans">
                  Ativa seu efeito após o último jogador do círculo completar seu turno.
                </p>
              </div>

              <div className="bg-[#140e0b] p-3.5 rounded-2xl border border-[#3d2e22] space-y-1 card-3d">
                <div className="font-black text-amber-400 font-cinzel text-xs flex items-center gap-1 uppercase">
                  🎭 CONTROLE
                </div>
                <p className="text-[11px] text-amber-200/70 font-sans">
                  Move temporariamente ou permanentemente um saqueador inimigo ou do descarte para o seu campo de batalha (respeitando o limite de 4 cartas).
                </p>
              </div>

              <div className="bg-[#140e0b] p-3.5 rounded-2xl border border-[#3d2e22] space-y-1 card-3d">
                <div className="font-black text-yellow-400 font-cinzel text-xs flex items-center gap-1 uppercase">
                  💰 ROUBAR
                </div>
                <p className="text-[11px] text-amber-200/70 font-sans">
                  Remove marcadores de tesouro de um oponente para transferir para si mesmo ou para a recompensa do monstro ativo.
                </p>
              </div>

              <div className="bg-[#140e0b] p-3.5 rounded-2xl border border-[#3d2e22] space-y-1 md:col-span-2 card-3d">
                <div className="font-black text-yellow-400 font-cinzel text-xs flex items-center gap-1 uppercase">
                  🔗 VÍNCULO DE TIPOS
                </div>
                <p className="text-[11px] text-amber-200/70 font-sans">
                  Os saqueadores pertencem a três classes: <strong>Combatente</strong> (espadas e força bruta), <strong>Conjurador</strong> (magia e dano arcano a mortos-vivos) e <strong>Fera</strong> (ataque em matilha). Cartas com Vínculo ganham bônus de dados ou efeitos adicionais se você mantiver outros aliados da mesma classe em campo.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#140e0b] border-t border-[#3d2e22] flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 btn-fantasy-gold text-black font-black uppercase text-xs rounded-xl shadow-lg transition cursor-pointer font-cinzel"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

