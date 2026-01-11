// Lazy-loaded date logging constants

export const DEFAULT_ACTIVITIES = ['Coffee', 'Dinner', 'Drinks', 'Walk', 'Movie', 'Activity'] as const;

export const EMOJI_OPTIONS = [
  '😊', '😍', '🥰', '😎', '🤩', '😌', '🙂', '😋', '🤗', '😄', 
  '😃', '😁', '✨', '💫', '🌟', '💖', '💕', '🎉', '🎊', '🔥'
] as const;

export const FEELINGS = [
  { label: 'Bad', value: 'bad' },
  { label: 'Meh', value: 'meh' },
  { label: 'Good', value: 'good' },
  { label: 'Great', value: 'great' },
] as const;

export const getRandomEmoji = () => {
  return EMOJI_OPTIONS[Math.floor(Math.random() * EMOJI_OPTIONS.length)];
};

