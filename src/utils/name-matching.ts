const SUFFIXES = new Set(['jr', 'sr', 'ii', 'iii', 'iv', 'phd', 'md']);
const SURNAME_PARTICLES = new Set(['de', 'del', 'della', 'der', 'di', 'du', 'la', 'le', 'van', 'von', 'den', 'ten', 'ter']);

type ParsedName = { given: string[]; surname: string[] };

function tokens(value: string): string[] {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .split(/\s+/)
    .map(part => part.replace(/[^a-z]/g, ''))
    .filter(part => part.length > 0 && !SUFFIXES.has(part));
}

export function parseProfessorName(name: string): ParsedName {
  if (name.includes(',')) {
    const [surname, ...given] = name.split(',');
    return { given: tokens(given.join(' ')), surname: tokens(surname) };
  }

  const parts = tokens(name);
  if (parts.length <= 1) return { given: [], surname: parts };
  const finalPart = parts[parts.length - 1];
  if (finalPart.length === 1) {
    return { given: [finalPart], surname: parts.slice(0, -1) };
  }
  let surnameStart = parts.length - 1;
  while (surnameStart > 1 && SURNAME_PARTICLES.has(parts[surnameStart - 1])) {
    surnameStart -= 1;
  }
  return { given: parts.slice(0, surnameStart), surname: parts.slice(surnameStart) };
}

export function professorNamesMatch(left: string, right: string): boolean {
  const a = parseProfessorName(left);
  const b = parseProfessorName(right);
  if (a.surname.length === 0 || b.surname.length === 0) return false;

  const significantSurname = (parts: string[]): string[] => {
    const significant = parts.filter(part => !SURNAME_PARTICLES.has(part));
    return significant.length ? significant : parts;
  };
  const aSurname = significantSurname(a.surname);
  const bSurname = significantSurname(b.surname);
  if (a.surname.join('') !== b.surname.join('') &&
      !aSurname.some(aName => bSurname.includes(aName))) return false;
  if (a.given.length === 0 || b.given.length === 0) return true;

  return a.given.some(aName =>
    b.given.some(
      bName =>
        aName === bName ||
        (aName.length === 1 && aName[0] === bName[0]) ||
        (bName.length === 1 && aName[0] === bName[0])
    )
  );
}
