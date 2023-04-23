import { Uwurandom } from 'uwurandom-node';

export const uwurandom = (len: number): string => {
  const uwurandom = Uwurandom.new();
  let result = '';

  for (let i = 0; i < len; i++) {
    result += uwurandom.generate();
  }

  return result;
};
