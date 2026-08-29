#!/usr/bin/env node
/**
 * The gate on a Lighthouse run of the **exported** page — DEVOPS.md § Export smoke test: "The exported
 * page must itself score ≥ 90 Performance and ≥ 95 Accessibility. If our generator produces a slow or
 * inaccessible page, the feature is broken regardless of whether it compiles."
 *
 * ```
 * npx lighthouse http://localhost:3100 --output=json --output-path=./lh.json
 * node scripts/assert-lighthouse.mjs ./lh.json --performance 90 --accessibility 95
 * ```
 *
 * Every category in the report is printed, and only the ones named on the command line are asserted:
 * a number nobody set a threshold for is information, and a threshold chosen after seeing the number
 * would be the banned fourth way — ENGINEERING_CONTRACT.md § 9.
 */
import { readFileSync } from 'node:fs'

const [, , reportPath, ...rest] = process.argv

if (reportPath === undefined) {
  console.error(
    'usage: assert-lighthouse.mjs <report.json> [--performance 90] [--accessibility 95]',
  )
  process.exit(2)
}

const thresholds = new Map()

for (let index = 0; index < rest.length; index += 2) {
  const flag = rest[index]
  const value = Number(rest[index + 1])

  if (flag?.startsWith('--') === true && Number.isFinite(value)) {
    thresholds.set(flag.slice(2), value)
  }
}

const report = JSON.parse(readFileSync(reportPath, 'utf8'))
const categories = Object.values(report.categories ?? {})

if (categories.length === 0) {
  console.error(`No categories in ${reportPath}. Lighthouse did not produce a report.`)
  process.exit(1)
}

const failures = []

for (const category of categories) {
  const score = Math.round((category.score ?? 0) * 100)
  const threshold = thresholds.get(category.id)

  console.log(
    `${category.title.padEnd(16)} ${String(score).padStart(3)}${
      threshold === undefined ? '' : `   (must be ≥ ${threshold})`
    }`,
  )

  if (threshold !== undefined && score < threshold) {
    failures.push(`${category.title} scored ${score}, under the ${threshold} this job asserts`)
  }
}

if (failures.length > 0) {
  console.error(`\n${failures.join('\n')}`)
  process.exit(1)
}
