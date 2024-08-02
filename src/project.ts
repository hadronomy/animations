import { makeProject } from '@motion-canvas/core';
import { Code, LezerHighlighter } from '@motion-canvas/2d';
import { parser } from '@lezer/javascript';

import example from './scenes/example?scene';

Code.defaultHighlighter = new LezerHighlighter(parser);

export default makeProject({
  scenes: [example],
});
