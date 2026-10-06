export { selectGroupById, selectGroups } from "./model/selectors"
export {
  addGroup,
  clearGroups,
  groupsReducer,
  removeGroup,
  setGroups,
  updateGroup,
} from "./model/slice"
export { GROUP_COLORS, type Group, type GroupDraft } from "./model/types"
export { GroupMark } from "./ui/group-mark"
