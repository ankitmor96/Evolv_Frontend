// Adds up reaction counts across all of the user's posts
export function sumReactionTotals(posts = []) {
  const list = Array.isArray(posts) ? posts : [];

  return list.reduce(
    (acc, p) => ({
      appreciation: acc.appreciation + (Number(p.appreciations) || 0),
      helpful: acc.helpful + (Number(p.helpfulCount) || 0),
      learned: acc.learned + (Number(p.learnedCount) || 0),
    }),
    { appreciation: 0, helpful: 0, learned: 0 }
  );
}