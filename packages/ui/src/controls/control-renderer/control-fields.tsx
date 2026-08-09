import { assertNever } from '@motion-studio/utils'
import { type ReactElement, type ReactNode, Suspense, lazy } from 'react'

import { ScrubField } from '../scrub-field/index'
import { SegmentedField } from '../segmented-field/index'
import { SelectField } from '../select-field/index'
import { SliderField } from '../slider-field/index'
import { StepperField } from '../stepper-field/index'
import { SwitchField } from '../switch-field/index'
import { TextField } from '../text-field/index'
import { TextareaField } from '../textarea-field/index'

import {
  asAlign,
  asBoolean,
  asColor,
  asFont,
  asImage,
  asLink,
  asNumber,
  asRadius,
  asShadow,
  asSpacing,
  asString,
} from './coerce'
import type { ControlRendererProps } from './control-renderer.types'
import {
  optionBoolean,
  optionNumber,
  optionString,
  segmentedOptions,
  selectOptions,
} from './descriptor-options'

/**
 * PERFORMANCE.md § Bundle, and the `/studio` first-load budget of the contract. The switch below
 * names every control kind, so a static import of each would put the colour maths, the shadow stack
 * editor, the gradient track and the whole icon registry in the panel's first chunk — 70 kB gzip of
 * controls a heading never renders. The eight kinds the common inspector actually draws stay static;
 * everything else is a chunk that arrives when a block first declares it.
 */
const ColorField = lazy(() =>
  import('../color-field/index').then((module) => ({ default: module.ColorField })),
)
const AlignField = lazy(() =>
  import('../align-field/index').then((module) => ({ default: module.AlignField })),
)
const CssField = lazy(() =>
  import('../css-field/index').then((module) => ({ default: module.CssField })),
)
const FontField = lazy(() =>
  import('../font-field/index').then((module) => ({ default: module.FontField })),
)
const GradientControl = lazy(() =>
  import('./gradient-control').then((module) => ({ default: module.GradientControl })),
)
const IconControl = lazy(() =>
  import('./icon-control').then((module) => ({ default: module.IconControl })),
)
const ImageField = lazy(() =>
  import('../image-field/index').then((module) => ({ default: module.ImageField })),
)
const LinkField = lazy(() =>
  import('../link-field/index').then((module) => ({ default: module.LinkField })),
)
const ListControl = lazy(() =>
  import('./list-control').then((module) => ({ default: module.ListControl })),
)
const RadiusField = lazy(() =>
  import('../radius-field/index').then((module) => ({ default: module.RadiusField })),
)
const RichTextField = lazy(() =>
  import('../rich-text-field/index').then((module) => ({ default: module.RichTextField })),
)
const ShadowField = lazy(() =>
  import('../shadow-field/index').then((module) => ({ default: module.ShadowField })),
)
const SpacingField = lazy(() =>
  import('../spacing-field/index').then((module) => ({ default: module.SpacingField })),
)

/** One skeleton for every deferred control: the row keeps its height while the chunk arrives. */
const Deferred = ({ children }: { readonly children: ReactNode }): ReactElement => (
  <Suspense fallback={<span className="h-7 w-full rounded-xs bg-surface-2" />}>{children}</Suspense>
)

/**
 * One `switch` over `ControlDescriptor.kind`, exhaustive by `assertNever`: adding a kind to
 * `CONTROL_KINDS` breaks the build here until it is handled, which is the intended behaviour.
 *
 * The whole file is behind one `lazy` in `control-renderer.tsx`, so a studio with nothing selected
 * has downloaded no control at all — the `/studio` first-load budget is 250 kB and the controls are
 * 40 of them.
 */
export function ControlFields(props: ControlRendererProps): ReactElement {
  const { descriptor, value, onChange, onCommit, slot, disabled, mixed } = props

  const common = {
    label: descriptor.label,
    // A handler that takes `unknown` satisfies a control that hands it a string: the parameter is
    // contravariant, so no cast is needed in either direction.
    onChange,
    onCommit,
    ...(slot ?? {}),
    ...(disabled === undefined ? {} : { disabled }),
    ...(mixed === undefined ? {} : { mixed: (slot?.mixed ?? false) || mixed }),
  }

  const bounds = {
    ...(optionNumber(descriptor, 'min') === undefined
      ? {}
      : { min: optionNumber(descriptor, 'min') }),
    ...(optionNumber(descriptor, 'max') === undefined
      ? {}
      : { max: optionNumber(descriptor, 'max') }),
    ...(optionNumber(descriptor, 'step') === undefined
      ? {}
      : { step: optionNumber(descriptor, 'step') }),
    ...(optionString(descriptor, 'unit') === undefined
      ? {}
      : { unit: optionString(descriptor, 'unit') }),
    ...(optionNumber(descriptor, 'precision') === undefined
      ? {}
      : { precision: optionNumber(descriptor, 'precision') }),
  }

  const text = {
    ...(optionNumber(descriptor, 'maxLength') === undefined
      ? {}
      : { maxLength: optionNumber(descriptor, 'maxLength') }),
    ...(optionString(descriptor, 'placeholder') === undefined
      ? {}
      : { placeholder: optionString(descriptor, 'placeholder') }),
  }

  switch (descriptor.kind) {
    case 'text':
      return <TextField {...common} {...text} value={asString(value)} />
    case 'textarea':
      return (
        <TextareaField
          {...common}
          {...text}
          {...(optionNumber(descriptor, 'rows') === undefined
            ? {}
            : { rows: optionNumber(descriptor, 'rows') })}
          value={asString(value)}
        />
      )
    case 'richText':
      return (
        <Deferred>
          <RichTextField
            {...common}
            {...(optionString(descriptor, 'placeholder') === undefined
              ? {}
              : { placeholder: optionString(descriptor, 'placeholder') })}
            value={asString(value)}
          />
        </Deferred>
      )
    case 'number':
      return <ScrubField {...common} {...bounds} value={asNumber(value)} />
    case 'slider':
      return <SliderField {...common} {...bounds} value={asNumber(value)} />
    case 'stepper':
      return <StepperField {...common} {...bounds} value={asNumber(value)} />
    case 'select':
      return <SelectField {...common} options={selectOptions(descriptor)} value={asString(value)} />
    case 'segmented':
      return (
        <SegmentedField
          {...common}
          options={segmentedOptions(descriptor)}
          value={asString(value)}
        />
      )
    case 'switch':
      return (
        <SwitchField
          {...common}
          {...(descriptor.hint === undefined ? {} : { hint: descriptor.hint })}
          value={asBoolean(value)}
        />
      )
    case 'color':
      return (
        <Deferred>
          <ColorField
            {...common}
            {...(optionBoolean(descriptor, 'alpha') === undefined
              ? {}
              : { alpha: optionBoolean(descriptor, 'alpha') })}
            value={asColor(value)}
          />
        </Deferred>
      )
    case 'gradient':
      return (
        <Deferred>
          <GradientControl {...common} value={value} />
        </Deferred>
      )
    case 'shadow':
      return (
        <Deferred>
          <ShadowField
            {...common}
            {...(optionNumber(descriptor, 'max') === undefined
              ? {}
              : { max: optionNumber(descriptor, 'max') })}
            value={asShadow(value)}
          />
        </Deferred>
      )
    case 'spacing':
      return (
        <Deferred>
          <SpacingField
            {...common}
            {...bounds}
            {...(optionBoolean(descriptor, 'linked') === undefined
              ? {}
              : { linked: optionBoolean(descriptor, 'linked') })}
            value={asSpacing(value)}
          />
        </Deferred>
      )
    case 'radius':
      return (
        <Deferred>
          <RadiusField {...common} {...bounds} value={asRadius(value)} />
        </Deferred>
      )
    case 'align':
      return (
        <Deferred>
          <AlignField {...common} value={asAlign(value)} />
        </Deferred>
      )
    case 'font':
      return (
        <Deferred>
          <FontField {...common} value={asFont(value)} />
        </Deferred>
      )
    case 'image':
      return (
        <Deferred>
          <ImageField
            {...common}
            {...(optionNumber(descriptor, 'aspect') === undefined
              ? {}
              : { aspect: optionNumber(descriptor, 'aspect') })}
            value={asImage(value)}
          />
        </Deferred>
      )
    case 'icon':
      return (
        <Deferred>
          <IconControl {...common} value={value} />
        </Deferred>
      )
    case 'link':
      return (
        <Deferred>
          <LinkField {...common} value={asLink(value)} />
        </Deferred>
      )
    case 'list':
      return (
        <Deferred>
          <ListControl {...props} renderControl={(inner) => <ControlFields {...inner} />} />
        </Deferred>
      )
    case 'css':
      return (
        <Deferred>
          <CssField
            {...common}
            {...(optionNumber(descriptor, 'rows') === undefined
              ? {}
              : { rows: optionNumber(descriptor, 'rows') })}
            value={asString(value)}
          />
        </Deferred>
      )
    // ADR-109: both controls arrive with the prompts that build their engines. A note names it;
    // rendering nothing would look like a bug in the block's metadata.
    case 'motion':
      return <Unbuilt kind="Motion" prompt="the motion engine" />
    case 'effect':
      return <Unbuilt kind="Effect" prompt="the effects panel" />
    default:
      return assertNever(descriptor.kind, `no control renders the ${descriptor.kind} kind`)
  }
}

function Unbuilt({
  kind,
  prompt,
}: { readonly kind: string; readonly prompt: string }): ReactElement {
  return (
    <span className="text-2xs text-foreground-subtle" data-testid="control-unbuilt">
      {kind} controls arrive with {prompt}
    </span>
  )
}
