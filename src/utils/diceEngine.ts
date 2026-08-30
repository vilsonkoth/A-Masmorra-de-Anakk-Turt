import { DiceResult, RaiderCard, MonsterCard, CombatResolution } from '../types/game';

/**
 * Rolls N dice (each 1-6) based on the official "A Masmorra de Anakk Tur" D6 distribution:
 * Face 1: 1 Dano
 * Face 2: 1 Dano
 * Face 3: 2 Danos
 * Face 4: 3 Danos (Crítico)
 * Face 5: 0 Dano (Nulo)
 * Face 6: 0 Dano (Nulo)
 */
export function rollDice(count: number): DiceResult[] {
  const results: DiceResult[] = [];
  for (let i = 0; i < count; i++) {
    const value = Math.floor(Math.random() * 6) + 1;
    let damageValue = 0;
    if (value === 1 || value === 2) {
      damageValue = 1;
    } else if (value === 3) {
      damageValue = 2;
    } else if (value === 4) {
      damageValue = 3;
    } else {
      damageValue = 0; // Faces 5 and 6 are blanks (Nulos)
    }

    const isHit = damageValue > 0;
    results.push({
      dieNumber: i + 1,
      value,
      damageValue,
      isHit,
      isBlank: !isHit,
    });
  }
  return results;
}

/**
 * Resolves a combat attack from an attacking Raider against a Monster or enemy Raider,
 * applying type interactions (Combatente, Conjurador, Fera), custom reaction damage, and multipliers.
 */
export function resolveAttack(
  attacker: RaiderCard,
  attackerOwnerName: string,
  target: MonsterCard | RaiderCard,
  targetOwnerName?: string,
  extraDice: number = 0,
  bonusFlatDamage: number = 0,
  reactionMultiplier: number = 1
): CombatResolution {
  const totalDice = Math.max(1, attacker.diceCount + extraDice);
  const diceRolled = rollDice(totalDice);

  const totalRawDamage = diceRolled.reduce((sum, d) => sum + d.damageValue, 0);
  const hitsCount = diceRolled.filter(d => d.isHit).length;
  const blanks = diceRolled.filter(d => d.isBlank).length;

  // Apply flat damage bonus (e.g. Combatente against Aranha Gigante, Conjurador against Esqueleto, etc.)
  const totalDamage = totalRawDamage > 0 ? (totalRawDamage + bonusFlatDamage) : 0;

  const targetIsMonster = 'level' in target;
  const newTargetDamage = target.damage + totalDamage;
  const targetDied = newTargetDamage >= target.maxHp;

  let reactionDamage = 0;
  let attackerDied = false;

  if (!targetDied) {
    // If target survives and has dice to react (e.g. monster/raider with diceCount > 0)
    const targetCanReact = ('diceCount' in target) ? target.diceCount > 0 : true;
    reactionDamage = targetCanReact ? (blanks * reactionMultiplier) : 0;
    const newAttackerDamage = attacker.damage + reactionDamage;
    attackerDied = newAttackerDamage >= attacker.maxHp;
  }

  const treasureEarned = targetDied && targetIsMonster ? ((target as MonsterCard).treasureReward || 0) : 0;

  let message = '';
  const bonusMsg = bonusFlatDamage > 0 && totalRawDamage > 0 ? ` (+${bonusFlatDamage} bônus)` : '';
  if (targetDied) {
    message = `⚔️ ${attacker.name} atacou ${target.name} causando ${totalRawDamage}${bonusMsg} de Dano (${hitsCount} acertos, ${blanks} nulos). Total: ${totalDamage} dano. Alvo DERROTADO! +${treasureEarned} Tesouro(s) obtido(s)!`;
  } else {
    message = `⚔️ ${attacker.name} atacou ${target.name} causando ${totalDamage} de Dano${bonusMsg}. ${target.name} sobreviveu e revidou com ${reactionDamage} de DANO DE REAÇÃO (${blanks} nulos x ${reactionMultiplier})!`;
    if (attackerDied) {
      message += ` 💀 ${attacker.name} tombou pela reação!`;
    }
  }

  return {
    attackerId: attacker.id,
    attackerName: attacker.name,
    attackerIsRaider: true,
    targetId: target.id,
    targetName: target.name,
    targetIsMonster,
    targetOwnerId: targetOwnerName,
    diceRolled,
    hits: totalDamage,
    blanks,
    damageDealt: totalDamage,
    targetDied,
    reactionDamage,
    attackerDied,
    treasureEarned,
    message
  };
}
