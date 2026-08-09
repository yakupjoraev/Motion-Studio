import { configure } from '@testing-library/react'

/**
 * The inspector is code-split — its body and its controls are chunks, so every query for a control
 * waits for a dynamic import to resolve. One second is Testing Library's default and it is enough on
 * a warm laptop and not on a cold CI runner, which is what turned three passing tests red.
 *
 * Five seconds is a timeout, not a sleep: a test that finds its element in 40 ms still takes 40 ms.
 */
configure({ asyncUtilTimeout: 5000 })
