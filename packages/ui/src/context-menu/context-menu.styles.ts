/**
 * A context menu has no styles of its own. It borrows `Dropdown`'s content, item, separator, label and
 * shortcut fragments wholesale — the two are the same list of commands reached two ways, and a second copy
 * of those five `cva` calls is five chances for the right-click menu to drift from the button menu.
 *
 * The file exists because the six-file component layout says it does, and because an empty one is a clearer
 * statement than a missing one: the styles are somewhere, and this says where.
 */
export {
  dropdownContentStyles as contextMenuContentStyles,
  dropdownItemStyles as contextMenuItemStyles,
  dropdownLabelStyles as contextMenuLabelStyles,
  dropdownSeparatorStyles as contextMenuSeparatorStyles,
  dropdownShortcutStyles as contextMenuShortcutStyles,
} from '../dropdown/index'
