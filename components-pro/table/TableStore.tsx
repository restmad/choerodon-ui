import React, { Children, isValidElement, ReactNode } from 'react';
import { action, computed, observable, runInAction, toJS } from 'mobx';
import measureScrollbar from 'choerodon-ui/lib/_util/measureScrollbar';
import Column, { ColumnProps, columnWidth } from './Column';
import DataSet from '../data-set/DataSet';
import Record from '../data-set/Record';
import CheckBox from '../check-box';
import Radio from '../radio';
import { DataSetSelection } from '../data-set/enum';
import { ColumnAlign, ColumnLock, SelectionMode, TableMode } from './enum';
import { stopPropagation } from '../_util/EventManager';
import { getHeader } from './utils';
import getReactNodeText from '../_util/getReactNodeText';

const SELECTION_KEY = 'selection-column';

function groupColumns
(columns: ColumnProps[], currentRow = 0, parentColumn: ColumnProps = {}, rows: ColumnProps[][] = [], cols: number[] = [0]): ColumnProps[] {
  rows[currentRow] = rows[currentRow] || [];
  const grouped: ColumnProps[] = [];
  const setRowSpan = (column: ColumnProps) => {
    const rowSpan = rows.length - currentRow;
    if (column && (!column.children || column.children.length === 0) &&
      rowSpan > 1 && (!column.rowSpan || column.rowSpan < rowSpan)) {
      column.rowSpan = rowSpan;
    }
  };
  columns.forEach((column, index) => {
    const newColumn: ColumnProps = { ...column };
    rows[currentRow].push(newColumn);
    parentColumn.colSpan = parentColumn.colSpan || 0;
    if (newColumn.children && newColumn.children.length > 0) {
      newColumn.children = groupColumns(newColumn.children, currentRow + 1, newColumn, rows, cols);
      parentColumn.colSpan = parentColumn.colSpan + (newColumn.colSpan || 0);
    } else {
      newColumn.index = cols[0]++;
      parentColumn.colSpan++;
    }
    for (let i = 0; i < rows[currentRow].length - 1; ++i) {
      setRowSpan(rows[currentRow][i]);
    }
    if (index + 1 === columns.length) {
      setRowSpan(newColumn);
    }
    grouped.push(newColumn);
  });
  return observable.array(grouped);
}

export default class TableStore {

  node: any;

  dataSet: DataSet;

  @observable props: any;

  @observable bodyHeight: number;
  @observable width?: number;
  @observable height?: number;

  @observable lockColumnsBodyRowsHeight: any;
  @observable lockColumnsFootRowsHeight: any;
  @observable lockColumnsHeadRowsHeight: any;

  @observable expandedRows: Record[];

  @observable currentEditorName?: string;

  @observable showCachedSeletion?: boolean;

  get isTree(): boolean {
    return this.props.mode === TableMode.tree;
  }

  get editing(): boolean {
    return this.currentEditorName !== void 0;
  }

  @computed
  get hasRowBox(): boolean {
    const { dataSet, selectionMode } = this.props;
    if (dataSet) {
      const { selection } = dataSet;
      return selection && selectionMode === SelectionMode.rowbox;
    }
    return false;
  }

  @computed
  get overflowX(): boolean {
    if (this.width) {
      return this.totalLeafColumnsWidth > this.width;
    }
    return false;
  }

  @computed
  get overflowY(): boolean {
    const { bodyHeight, height } = this;
    return bodyHeight !== void 0 && height !== void 0 && height < bodyHeight + (this.overflowX ? measureScrollbar() : 0);
  }

  @computed
  get columns(): ColumnProps[] {
    const { columns, children } = this.props;
    return groupColumns(this._addSelectionColumn(toJS(columns) || normalizeColumns(children)));
  }

  @computed
  get columnHeaders(): { name: string }[] {
    const { leafNamedColumns, dataSet } = this;
    return leafNamedColumns.map((column) => ({ name: column.name!, label: getReactNodeText(getHeader(column, dataSet)) }));
  }

  private handleSelectAllChange = action((value) => {
    const { dataSet, filter } = this.props;
    if (value) {
      dataSet.selectAll(filter);
    } else {
      dataSet.unSelectAll();
      if (this.showCachedSeletion) {
        dataSet.clearCachedSelected();
      }
    }
  });

  constructor(node) {
    runInAction(() => {
      this.showCachedSeletion = false;
      this.lockColumnsHeadRowsHeight = {};
      this.lockColumnsBodyRowsHeight = {};
      this.lockColumnsFootRowsHeight = {};
      this.node = node;
      this.expandedRows = [];
    });
    this.setProps(node.props);
  }

  @action
  showEditor(name: string) {
    this.currentEditorName = name;
  }

  @action
  hideEditor() {
    this.currentEditorName = void 0;
  }

  showNextEditor(name: string, reserve: boolean) {
    if (reserve) {
      this.dataSet.pre();
    } else {
      this.dataSet.next();
    }
    this.showEditor(name);
  }

  @action
  setProps(props) {
    const { dataSet } = props;
    this.props = props;
    this.dataSet = dataSet;
  }

  isRowExpanded(record: Record): boolean {
    if (this.dataSet.props.expandField) {
      return record.isExpanded;
    } else {
      const expanded = this.expandedRows.indexOf(record) !== -1;
      if (expanded) {
        const { parent } = record;
        if (!parent || this.isRowExpanded(parent)) {
          return true;
        }
      }
    }
    return false;
  }

  @action
  setRowExpanded(record: Record, expanded: boolean) {
    if (this.dataSet.props.expandField) {
      record.isExpanded = expanded;
    } else {
      if (expanded) {
        this.expandedRows.push(record);
      } else {
        const index = this.expandedRows.indexOf(record);
        if (index !== -1) {
          this.expandedRows.splice(index, 1);
        }
      }
    }
  }

  expandAll() {
    this.dataSet.data.forEach(record => this.setRowExpanded(record, true));
  }

  collapseAll() {
    this.dataSet.data.forEach(record => this.setRowExpanded(record, false));
  }

  @computed
  get hasCheckFieldColumn(): boolean {
    const { checkField } = this.dataSet.props;
    return this.leafColumns.some(({ name, editor }) => !!editor && checkField === name);
  }

  @computed
  get hasFooter(): boolean {
    return this.leafColumns.some(column => !!column.footer && column.key !== SELECTION_KEY);
  }

  @computed
  get totalLeafColumnsWidth(): number {
    return this.leafColumns.reduce((total, column) => total + columnWidth(column), 0);
  }

  @computed
  get leftLeafColumnsWidth(): number {
    return this.leftLeafColumns.reduce((total, column) => total + columnWidth(column), 0);
  }

  @computed
  get rightLeafColumnsWidth(): number {
    return this.rightLeafColumns.reduce((total, column) => total + columnWidth(column), 0);
  }

  @computed
  get isAnyColumnsResizable(): boolean {
    return this.leafColumns.some(column => column.resizable === true);
  }

  @computed
  get isAnyColumnsLock(): boolean {
    return this.columns.some(column => !!column.lock);
  }

  @computed
  get isAnyColumnsLeftLock(): boolean {
    return this.columns.some(column => column.lock === ColumnLock.left || column.lock === true);
  }

  @computed
  get isAnyColumnsRightLock(): boolean {
    return this.columns.some(column => column.lock === ColumnLock.right);
  }

  @computed
  get leftColumns(): ColumnProps[] {
    return this.columns.filter(column => column.lock === ColumnLock.left || column.lock === true);
  }

  @computed
  get rightColumns(): ColumnProps[] {
    return this.columns.filter(column => column.lock === ColumnLock.right);
  }

  @computed
  get leafColumns(): ColumnProps[] {
    return this._leafColumns(this.columns);
  }

  @computed
  get leftLeafColumns(): ColumnProps[] {
    return this._leafColumns(this.leftColumns);
  }

  @computed
  get rightLeafColumns(): ColumnProps[] {
    return this._leafColumns(this.rightColumns);
  }

  @computed
  get leafNamedColumns(): ColumnProps[] {
    return this.leafColumns.filter(column => !!column.name);
  }

  _leafColumns(columns: ColumnProps[]): ColumnProps[] {
    const leafColumns: ColumnProps[] = [];
    columns.forEach((column) => {
      if (!column.children || column.children.length === 0) {
        leafColumns.push(column);
      } else {
        leafColumns.push(...this._leafColumns(column.children));
      }
    });
    return leafColumns;
  }

  @computed
  get data(): Record[] {
    const { filter } = this.props;
    const { dataSet, isTree, showCachedSeletion } = this;
    let data = isTree ? dataSet.treeData : dataSet.data;
    if (typeof filter === 'function') {
      data = data.filter(filter);
    }
    if (showCachedSeletion) {
      return [...dataSet.cachedSelected, ...data];
    } else {
      return data;
    }
  }

  @computed
  get indeterminate(): boolean {
    const { dataSet, showCachedSeletion } = this;
    if (dataSet) {
      const { length } = (showCachedSeletion ? this.data : dataSet.data).filter(record => record.selectable);
      const selectedLength = showCachedSeletion ? dataSet.selected.length : dataSet.currentSelected.length;
      return !!selectedLength && selectedLength !== length;
    }
    return false;
  }

  @computed
  get allChecked() {
    const { dataSet, showCachedSeletion } = this;
    if (dataSet) {
      const { length } = (showCachedSeletion ? this.data : dataSet.data).filter(record => record.selectable);
      const selectedLength = showCachedSeletion ? dataSet.selected.length : dataSet.currentSelected.length;
      return !!selectedLength && selectedLength === length;
    }
    return false;
  }

  _addSelectionColumn(columns: ColumnProps[]): ColumnProps[] {
    if (this.hasRowBox) {
      const { dataSet } = this;
      const { prefixCls } = this.props;
      const selectionColumn: ColumnProps = {
        key: SELECTION_KEY,
        resizable: false,
        className: `${prefixCls}-selection-column`,
        renderer: renderSelectionBox,
        align: ColumnAlign.center,
        width: 50,
        lock: true,
      };
      if (dataSet) {
        const { selection } = dataSet;
        if (selection === DataSetSelection.multiple) {
          selectionColumn.header = selectionColumn.footer = () => (
            <CheckBox
              checked={this.allChecked}
              indeterminate={this.indeterminate}
              onChange={this.handleSelectAllChange}
              value
            />
          );
        }
      }
      columns.unshift(selectionColumn);
    }
    return columns;
  }
}

function renderSelectionBox({ record }) {
  const { dataSet } = record;
  if (dataSet) {
    const { selection } = dataSet;
    const handleChange = (value) => {
      if (value) {
        dataSet.select(record);
      } else {
        dataSet.unSelect(record);
      }
    };
    if (selection === DataSetSelection.multiple) {
      return (
        <CheckBox
          checked={record.isSelected}
          onChange={handleChange}
          onClick={stopPropagation}
          disabled={!record.selectable}
          value
        />
      );
    } else if (selection === DataSetSelection.single) {
      return (
        <Radio
          checked={record.isSelected}
          onChange={handleChange}
          onClick={stopPropagation}
          disabled={!record.selectable}
          value
        />
      );
    }
  }
}

function normalizeColumns(elements: ReactNode, parent?: ColumnProps) {
  const columns: any[] = [];
  const leftFixedColumns: any[] = [];
  const rightFixedColumns: any[] = [];
  Children.forEach(elements, (element) => {
    if (!isValidElement(element) || element.type !== Column) {
      return;
    }
    const { props, key } = element;
    const column: any = {
      ...props,
    };
    if (parent) {
      column.lock = parent.lock;
    }
    column.children = normalizeColumns(column.children, column);
    if (key) {
      column.key = key;
    }
    if (column.lock === ColumnLock.left || column.lock === true) {
      leftFixedColumns.push(column);
    } else if (column.lock === ColumnLock.right) {
      rightFixedColumns.push(column);
    } else {
      columns.push(column);
    }
  });
  return leftFixedColumns.concat(columns, rightFixedColumns);
}
