'use client';

import type { EvaluationTree } from '@/beta/schema/attribute-groups';
import {
  type AttributeGroup,
  type EvaluatedGroup,
  type ValueSet,
  type EvaluatedAttribute,
  Rating,
  type Value,
  evaluatedAttributesEntries,
  ratingToIcon,
  ratingToColor,
} from '@/beta/schema/attributes';
import { attributeEvaluationIsUniqueToVariant } from '@/beta/schema/wallet';
import { type NonEmptyArray, nonEmptyMap } from '@/beta/types/utils/non-empty';
import { Box, Typography } from '@mui/material';
import type React from 'react';
import { Arc, type PieSlice, RatingPie } from '../atoms/RatingPie';
import type { GridColTypeDef } from '@mui/x-data-grid';
import { expandedRowHeight, ratingCellWidth, shortRowHeight } from '../../constants';
import { useState } from 'react';
import type { WalletRowStateHandle } from '../WalletTableState';

/**
 * Common properties of rating-type columns.
 */
export const walletRatingColumnProps: GridColTypeDef = {
  resizable: false,
  filterable: false,
  editable: false,
  width: ratingCellWidth,
  minWidth: ratingCellWidth,
  maxWidth: ratingCellWidth,
  align: 'center',
  headerAlign: 'left',
};

const ratingPieMargin = 2;
const ratingPieHeight = shortRowHeight - ratingPieMargin * 2;
const ratingPieWidth = ratingPieHeight * 2;

/** A single cell evaluating a wallet on an attribute group. */
export function WalletRatingCell<Vs extends ValueSet>({
  row,
  attrGroup,
  evalGroupFn,
}: {
  row: WalletRowStateHandle;
  attrGroup: AttributeGroup<Vs>;
  evalGroupFn: (tree: EvaluationTree) => EvaluatedGroup<Vs>;
}): React.JSX.Element {
  const evalGroup = evalGroupFn(row.evalTree);
  const { score, hasUnrated } = attrGroup.score(evalGroup);
  const centerLabel = hasUnrated
    ? ratingToIcon(Rating.UNRATED)
    : score <= 0.0
      ? '\u{1f480}' /* Skull */
      : score >= 1.0
        ? '\u{1f4af}' /* 100 */
        : Math.round(score * 100).toString();
  const [highlightedSlice, setHighlightedSlice] = useState<{
    evalAttrId: keyof EvaluatedGroup<Vs>;
    sticky: boolean;
  } | null>(null);
  const highlightedEvalAttr =
    highlightedSlice === null ? null : evalGroup[highlightedSlice.evalAttrId];
  const slices: NonEmptyArray<PieSlice> = nonEmptyMap(
    evaluatedAttributesEntries(evalGroup),
    ([evalAttrId, evalAttr]: [keyof EvaluatedGroup<Vs>, EvaluatedAttribute<Value>]): PieSlice => {
      const icon = evalAttr.evaluation.value.icon ?? evalAttr.attribute.icon;
      const tooltipSuffix =
        row.table.variantSelected !== null &&
        attributeEvaluationIsUniqueToVariant(
          row.wallet,
          row.table.variantSelected,
          evalAttr.attribute
        )
          ? ` (${row.table.variantSelected} only)`
          : '';
      return {
        id: evalAttrId.toString(),
        color: ratingToColor(evalAttr.evaluation.value.rating),
        weight: 1,
        arcLabel: icon,
        tooltip: `${icon} ${evalAttr.evaluation.value.displayName}${tooltipSuffix}`,
        tooltipValue: ratingToIcon(evalAttr.evaluation.value.rating),
        focusChange: (focused: boolean) => {
          if (focused) {
            setHighlightedSlice({
              evalAttrId,
              sticky: highlightedSlice === null ? false : highlightedSlice.sticky,
            });
          } else if (highlightedSlice !== null) {
            setHighlightedSlice(highlightedSlice.sticky ? { evalAttrId, sticky: true } : null);
          }
        },
        click: () => {
          setHighlightedSlice(
            highlightedSlice === null ? null : { evalAttrId, sticky: !highlightedSlice.sticky }
          );
          row.setExpanded(true);
        },
      };
    }
  );
  return (
    <Box display="flex" flexDirection="column" alignItems="center" gap="4px" sx={row.rowWideStyle}>
      <RatingPie
        pieId={attrGroup.id}
        slices={slices}
        highlightedSliceId={
          highlightedSlice === null ? null : highlightedSlice.evalAttrId.toString()
        }
        arc={Arc.TOP_HALF}
        width={ratingPieWidth}
        height={ratingPieHeight}
        centerLabel={centerLabel}
      />
      {row.expanded ? (
        <Box
          height={expandedRowHeight - shortRowHeight}
          display="flex"
          flexDirection="column"
          lineHeight="1"
          gap="4px"
          sx={{ lineHeight: 1, whiteSpace: 'normal' }}
        >
          {highlightedEvalAttr === null ? (
            <>
              <Typography variant="h5" fontSize="0.8rem" whiteSpace="nowrap">
                {attrGroup.icon} {attrGroup.displayName}
              </Typography>
              {attrGroup.perWalletQuestion.render({
                ...row.wallet.metadata,
                typography: {
                  variant: 'caption',
                },
              })}
            </>
          ) : (
            <>
              <Typography variant="h6" fontSize="0.7rem" whiteSpace="nowrap">
                {highlightedEvalAttr.evaluation.value.icon ?? highlightedEvalAttr.attribute.icon}{' '}
                {highlightedEvalAttr.attribute.displayName}{' '}
              </Typography>
              {highlightedEvalAttr.evaluation.value.shortExplanation.render({
                ...row.wallet.metadata,
                prefix: ratingToIcon(highlightedEvalAttr.evaluation.value.rating) + ' ',
                suffix:
                  row.table.variantSelected !== null &&
                  attributeEvaluationIsUniqueToVariant(
                    row.wallet,
                    row.table.variantSelected,
                    highlightedEvalAttr.attribute
                  )
                    ? ` This is only the case on the ${row.table.variantSelected} version.`
                    : '',
                typography: {
                  variant: 'caption',
                  lineHeight: 1.15,
                },
              })}
            </>
          )}
        </Box>
      ) : null}
    </Box>
  );
}
