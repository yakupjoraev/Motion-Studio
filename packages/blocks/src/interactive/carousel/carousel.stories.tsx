import type { Meta, StoryObj } from '@storybook/react'

import { Carousel } from './carousel'
import { carouselDefinition } from './carousel.definition'

const meta: Meta<typeof Carousel> = {
  title: 'Blocks/Interactive/Carousel',
  component: Carousel,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-4xl bg-surface-0 p-8">
        <Story />
      </div>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof Carousel>

export const Default: Story = { args: carouselDefinition.defaults }

export const OneAtATime: Story = {
  args: { ...carouselDefinition.defaults, perView: 1 },
}

export const FourInView: Story = {
  args: { ...carouselDefinition.defaults, perView: 4 },
}

/** Autoplay on, which is also the only composition that shows the pause control. */
export const PlayingItself: Story = {
  args: { ...carouselDefinition.defaults, autoplay: true, autoplayInterval: 3000 },
}

/** No controls at all: the strip is still fully operable, because the scrolling is the browser's. */
export const ScrollOnly: Story = {
  args: { ...carouselDefinition.defaults, arrows: false, dots: false },
}

export const WithABlockInTheFirstSlide: Story = {
  args: carouselDefinition.defaults,
  render: (args) => (
    <Carousel {...args}>
      <div className="rounded-md border border-border bg-surface-2 p-4 text-base text-foreground">
        A block dropped into the first slide
      </div>
    </Carousel>
  ),
}
