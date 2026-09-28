import { projectInputs as baseProjectInputs } from './projects.base'
import { expandedProjectInputs } from './projects.expansion'

export const projectInputs = [...baseProjectInputs, ...expandedProjectInputs]
