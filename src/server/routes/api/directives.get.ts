import { defineEventHandler } from 'h3';
import { DIRECTIVE_REFERENCE } from '../../../app/shared/api/directive-reference';

export default defineEventHandler(() => {
  return {
    directives: DIRECTIVE_REFERENCE,
    count: DIRECTIVE_REFERENCE.length,
  };
});
