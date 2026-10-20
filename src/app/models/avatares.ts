export const AVATAR_PADRAO = 'padrao';

export const AVATARES: string[] = [
  AVATAR_PADRAO,
  'avatar-anao-01', 'avatar-anao-02', 'avatar-anao-03',
  'avatar-elfo-01', 'avatar-elfo-02', 'avatar-elfo-03',
  'avatar-humano-01', 'avatar-humano-02', 'avatar-humano-03',
  'avatar-pequeno-01', 'avatar-pequeno-02', 'avatar-pequeno-03'
];

export function caminhoAvatar(avatar?: string): string {
  return `imagens/avatar/${avatar || AVATAR_PADRAO}.png`;
}