import { Typography, type TypographyOwnProps } from '@mui/material';
import type React from 'react';

/** An input template for rendering. */
type Input = object;

/**
 * An element that can be rendered to the DOM.
 */
export interface Renderable<I extends Input = Input> {
  /** Renders the element given an input template. */
  render: (input: I) => React.JSX.Element;
}

/**
 * A brandable implementation of Renderable.
 */
class Renderer<I extends Input, B> implements Renderable<I> {
  public readonly render: (input: I) => React.JSX.Element;
  public readonly __brand: B;

  constructor(renderFn: (input: I) => React.JSX.Element, brand: B) {
    this.render = renderFn;
    this.__brand = brand;
  }
}

/** An input template that contains Typography props. */
type WithTypography<I extends Input> = I & {
  prefix?: string;
  suffix?: string;
  typography?: TypographyOwnProps;
};

function typography<I extends Input, B>(
  text: string | ((input: I) => string),
  brand: B
): Renderer<I, B> {
  return new Renderer(
    (input: WithTypography<I>) => (
      <Typography {...(input.typography ?? {})}>
        {input.prefix ?? ''}
        {typeof text === 'string' ? text.trim() : text(input).trim()}
        {input.suffix ?? ''}
      </Typography>
    ),
    brand
  );
}

const sentenceBrand = 'sentence';
const sentenceMaxLength = 256;

/** A single sentence. */
export type Sentence<I extends Input = Input> = Renderable<WithTypography<I>> & {
  __brand: 'sentence';
};

/** A renderable sentence. */
export function sentence<I extends Input = Input>(
  text: string | ((input: I) => string)
): Sentence<I> {
  if (text.length > sentenceMaxLength) {
    throw new Error(
      `Sentence text is too long (${text.length} characters is over the maximum length of ${sentenceMaxLength} characters).`
    );
  }
  return typography(text, sentenceBrand);
}

const paragraphBrand = 'paragraph';
const paragraphMaxLength = 1024;

/** A short amount of text that fits in a single paragraph. */
export type Paragraph<I extends Input = Input> = Renderable<WithTypography<I>> & {
  __brand: 'paragraph';
};

/** A renderable paragraph. */
export function paragraph<I extends Input = Input>(
  text: string | ((input: I) => string)
): Paragraph<WithTypography<I>> {
  if (text.length > paragraphMaxLength) {
    throw new Error(
      `Paragraph text is too long (${text.length} characters is over the maximum length of ${paragraphMaxLength} characters).`
    );
  }
  return typography(text, paragraphBrand);
}