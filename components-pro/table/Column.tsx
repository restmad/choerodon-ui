import { Component, ComponentState, CSSProperties, ReactElement, ReactNode } from 'react';
import PropTypes from 'prop-types';
import Record from '../data-set/Record';
import { FormFieldProps, Renderer } from '../field/FormField';
import { ElementProps } from '../core/ViewComponent';
import { ColumnAlign, ColumnLock } from './enum';
import { get } from 'mobx';
import { ShowHelp } from '../field/enum';
import DataSet from '../data-set/DataSet';

export const defaultMinWidth = 100;

export interface ColumnProps extends ElementProps {
  /**
   * 列对照的字段名
   */
  name?: string;
  /**
   * 列宽
   * 不推荐给所有列设置宽度，而是给某一列不设置宽度达到自动宽度的效果
   */
  width?: number;
  /**
   * 最小列宽
   */
  minWidth?: number;
  /**
   * 列头
   */
  header?: ReactNode | ((dataSet: DataSet, name?: string) => ReactNode);
  /**
   * 列脚
   */
  footer?: ReactNode | ((dataSet: DataSet, name?: string) => ReactNode);
  /**
   * 单元格渲染回调
   */
  renderer?: Renderer;
  /**
   * 编辑器
   */
  editor?: ReactElement<FormFieldProps> | ((record: Record, name?: string) => ReactElement<FormFieldProps>) | true;
  /**
   * 是否锁定
   * 可选值： false | true | 'left' | 'right'
   * @default false
   */
  lock?: ColumnLock | boolean;
  /**
   * 文字对齐方式
   * 可选值： 'left' | 'center' | 'right'
   */
  align?: ColumnAlign;
  /**
   * 是否可调整宽度
   * @default true
   */
  resizable?: boolean;
  /**
   * 是否可排序
   * @default false
   */
  sortable?: boolean;
  /**
   * 列头内链样式
   */
  headerStyle?: CSSProperties;
  /**
   * 列头样式名
   */
  headerClassName?: string;
  /**
   * 列脚内链样式
   */
  footerStyle?: CSSProperties;
  /**
   * 列脚样式名
   */
  footerClassName?: string;
  /**
   * 列头提示信息
   */
  help?: string;
  /**
   * 显示提示信息的方式
   *
   */
  showHelp?: ShowHelp;
  colSpan?: number;
  rowSpan?: number;
  index?: number;
  children?: ColumnProps[];
}

export default class Column extends Component<ColumnProps, ComponentState> {
  static propTypes = {
    /**
     * 列对照的字段名
     */
    name: PropTypes.string,
    /**
     * 列宽
     * 不推荐给所有列设置宽度，而是给某一列不设置宽度达到自动宽度的效果
     */
    width: PropTypes.number,
    /**
     * 最小列宽
     */
    minWidth: PropTypes.number,
    /**
     * 列头
     */
    header: PropTypes.oneOfType([PropTypes.string, PropTypes.element, PropTypes.func]),
    /**
     * 列脚
     */
    footer: PropTypes.oneOfType([PropTypes.string, PropTypes.element, PropTypes.func]),
    /**
     * 单元格渲染回调
     */
    renderer: PropTypes.func,
    /**
     * 编辑器
     */
    editor: PropTypes.oneOfType([PropTypes.element, PropTypes.func, PropTypes.bool]),
    /**
     * 是否锁定
     * 可选值： false | true | 'left' | 'right'
     * @default false
     */
    lock: PropTypes.oneOf([
      ColumnLock.left, ColumnLock.right, true, false,
    ]),
    /**
     * 文字对齐方式
     * 可选值： 'left' | 'center' | 'right'
     */
    align: PropTypes.oneOf([ColumnAlign.left, ColumnAlign.center, ColumnAlign.right]),
    /**
     * 是否可调整宽度
     * @default true
     */
    resizable: PropTypes.bool,
    /**
     * 是否可排序
     * @default false
     */
    /**
     * 列头提示信息
     */
    help: PropTypes.string,
    /**
     * 显示提示信息的方式
     *
     */
    showHelp: PropTypes.oneOf([
      ShowHelp.tooltip,
      ShowHelp.newLine,
      ShowHelp.none,
    ]),
    sortable: PropTypes.bool,
    colSpan: PropTypes.number,
    rowSpan: PropTypes.number,
    children: PropTypes.array,
  };

  static defaultProps = {
    lock: false,
    resizable: true,
    sortable: false,
    minWidth: defaultMinWidth,
    showHelp: 'tooltip',
  };
}

export function minColumnWidth(col) {
  const width = get(col, 'width');
  const min = get(col, 'minWidth');
  const minWidth = min === void 0 ? defaultMinWidth : min;
  if (width === void 0) {
    return minWidth;
  }
  return Math.min(width, minWidth);
}

export function columnWidth(col) {
  const width = get(col, 'width');
  if (width === void 0) {
    const minWidth = get(col, 'minWidth');
    if (minWidth === void 0) {
      return defaultMinWidth;
    }
    return minWidth;
  }
  return width;
}
