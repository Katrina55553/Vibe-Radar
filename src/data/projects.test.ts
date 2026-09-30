import { describe, expect, it } from 'vitest'
import { projectInputs } from './projects'
import { enrichProject, experiences, forms, goals, times, tracks } from '../domain/project'

const projects = projectInputs.map(enrichProject)

describe('project data', () => {
  it('ranks every track continuously from 1 without gaps or duplicates', () => {
    for (const track of tracks) {
      const lane = projectInputs.filter((input) => input.track === track)
      expect(lane.length, track).toBeGreaterThan(0)
      expect(lane.map((input) => input.rank).sort((a, b) => a - b), track).toEqual(
        Array.from({ length: lane.length }, (_, index) => index + 1),
      )
    }
  })

  it('keeps all tracks the same size', () => {
    const sizes = tracks.map((track) => projectInputs.filter((input) => input.track === track).length)
    expect(new Set(sizes).size, `track sizes: ${sizes.join(', ')}`).toBe(1)
  })

  it('gives every project non-empty copy, tags and source', () => {
    for (const input of projectInputs) {
      const label = `${input.track}#${input.rank} ${input.title}`
      expect(input.title.trim(), label).not.toBe('')
      expect(input.desc.trim(), label).not.toBe('')
      expect(input.mvp.trim(), label).not.toBe('')
      expect(input.source.trim(), label).not.toBe('')
      expect(input.tags.length, label).toBeGreaterThan(0)
      for (const tag of input.tags) expect(tag.trim(), `${label} tag`).not.toBe('')
    }
  })

  it('uses unique titles across the whole board', () => {
    const titles = projectInputs.map((input) => input.title)
    expect(new Set(titles).size, 'duplicate titles found').toBe(titles.length)
  })

  it('derives a unique stable ID for every project', () => {
    const ids = projects.map((project) => project.id)
    expect(new Set(ids).size, 'duplicate project IDs found').toBe(ids.length)
    for (const project of projects) expect(project.id, project.title).toMatch(/^project:/)
  })

  it('stores likes as non-negative integers', () => {
    for (const input of projectInputs) {
      expect(Number.isSafeInteger(input.likes), input.title).toBe(true)
      expect(input.likes, input.title).toBeGreaterThanOrEqual(0)
    }
  })

  it('stores absolute http(s) source links', () => {
    for (const input of projectInputs) {
      if (input.sourceUrl === undefined) continue
      let protocol: string | undefined
      try {
        protocol = new URL(input.sourceUrl).protocol
      } catch {
        protocol = undefined
      }
      expect(protocol, input.sourceUrl).toMatch(/^https?:$/)
    }
  })

  it('declares profile and score overrides inside the allowed ranges', () => {
    for (const input of projectInputs) {
      if (input.profile) {
        if (input.profile.form) expect(forms, input.title).toContain(input.profile.form)
        if (input.profile.goal) expect(goals, input.title).toContain(input.profile.goal)
        if (input.profile.time) expect(times, input.title).toContain(input.profile.time)
        if (input.profile.exp) expect(experiences, input.title).toContain(input.profile.exp)
      }
      if (input.scores) {
        for (const key of ['ease', 'wow', 'useful', 'total'] as const) {
          const value = input.scores[key]
          if (value === undefined) continue
          expect(Number.isInteger(value), `${input.title} ${key}`).toBe(true)
          expect(value, `${input.title} ${key}`).toBeGreaterThanOrEqual(0)
          expect(value, `${input.title} ${key}`).toBeLessThanOrEqual(100)
        }
      }
    }
  })

  it('derives valid profiles and bounded scores for every project', () => {
    for (const project of projects) {
      const label = `${project.track}#${project.rank} ${project.title}`
      expect(forms, label).toContain(project.form)
      expect(goals, label).toContain(project.goal)
      expect(times, label).toContain(project.time)
      expect(experiences, label).toContain(project.exp)
      for (const key of ['ease', 'wow', 'useful', 'total'] as const) {
        expect(Number.isInteger(project[key]), `${label} ${key}`).toBe(true)
        expect(project[key], `${label} ${key}`).toBeGreaterThanOrEqual(0)
        expect(project[key], `${label} ${key}`).toBeLessThanOrEqual(100)
      }
    }
  })
})
