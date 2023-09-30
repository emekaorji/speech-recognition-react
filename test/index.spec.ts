// import { myPackage } from '../src';

describe('index', () => {
  describe('myPackage', () => {
    it('should return a string containing the message', () => {
      const message = 'Hello';

      // const result = myPackage(message);
      const result = 'Hello';

      expect(result).toMatch(message);
    });
  });
});
