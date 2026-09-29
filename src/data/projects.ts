import { projectInputs as baseProjectInputs } from './projects.base'
import { additionalProjectInputs } from './projects.additional'
import { expandedProjectInputs } from './projects.expansion'
import type { ProjectInput } from '../domain/project'

export const projectInputs: ProjectInput[] = [...baseProjectInputs, ...expandedProjectInputs, ...additionalProjectInputs]
