
export function pickRandomItem<T>(list: T[]) {
  const index = Math.floor(Math.random() * list.length);
  return list[index];
}

export function pickRandomItemNTimes<T>(list: T[], n: number) {
  return getNonConsecutiveRandoms(n, 0, list.length - 1).map(
    (index) => list[index],
  );
}

export function shuffle<T>(list: T[]) {
  const cloneList = [...list];
  let currentIndex = list.length;

  while (currentIndex != 0) {
    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    [cloneList[currentIndex], cloneList[randomIndex]] = [
      cloneList[randomIndex],
      cloneList[currentIndex],
    ];
  }
  return cloneList;
}

function getNonConsecutiveRandoms(
  n: number,
  min: number,
  max: number,
): number[] {
  if (min === max) {
    return new Array(n).fill(min);
  }

  const results: number[] = [];
  let previous: number | null = null;

  for (let i = 0; i < n; i++) {
    let current: number;

    // Keep generating until the number is different from the previous one
    do {
      current = Math.floor(Math.random() * (max - min + 1)) + min;
    } while (current === previous && min !== max);

    results.push(current);
    previous = current;
  }

  return results;
}
