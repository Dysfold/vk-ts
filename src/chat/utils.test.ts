import { test } from 'craftjs-plugin';
import { color, component, text } from 'craftjs-plugin/chat';
import { getPlainText } from './utils';

test('getPlainText()', (t) => {
  t.eq(getPlainText(text('hello')), 'hello', 'simple text component');
  t.eq(getPlainText(color('#aabbcc', 'world')), 'world', 'formatted text');
  t.eq(
    getPlainText(component(color('#aabbcc', 'hello'), text(' world'))),
    'hello world',
    'multiple text',
  );
});
