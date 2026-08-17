/**
 * A card in a moving row is width-capped rather than fluid: a testimonial that grows with the viewport
 * would make one row hold two cards on a phone and six on a desktop, and the loop would change character
 * with the window. 20rem is the width at which the default quotes hold three lines.
 */
/**
 * A card in a moving row is width-capped rather than fluid: a testimonial that grows with the viewport would
 * make one row hold two cards on a phone and six on a desktop, and the loop would change character with the
 * window. 20rem is the width at which the default quotes hold three lines.
 *
 * `grid` so the card fills the wrapper on **both** axes: the track stretches the wrapper's height, and a
 * grid item stretches to its area, so every card in a row ends at the same place instead of wherever its own
 * quote does. `flex` was measured first and collapsed the card to 50 px — a flex item sizes to its content
 * on the main axis, and the main axis here is the one that had to stay at 20rem.
 */
export const MARQUEE_CARD = 'grid w-[20rem] shrink-0'
