import { projectInputs as baseProjectInputs } from './projects.base'
import { additionalProjectInputs } from './projects.additional'
import { expandedProjectInputs } from './projects.expansion'

export const projectInputs = [...baseProjectInputs, ...expandedProjectInputs, ...additionalProjectInputs]
