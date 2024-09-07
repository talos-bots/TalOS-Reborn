import React from 'react';
import { useEffect, useState } from "react";
import { useDataset } from '../../../components/dataset/DatasetProvider';

const StatisticsWindow = () => {
  const { dataset } = useDataset();

  return (
    <div className="rounded-box bg-base-100 h-full gap-2 flex flex-col px-2 overflow-y-scroll text-base-content">
      <label className="font-semibold">Accepted Messages Generated</label>
      <p className="font-semibold dy-textarea dy-textarea-bordered">{dataset?.messages.length ?? 0}</p>
      <label className="font-semibold">Bad Words Generated</label>
      <p className="font-semibold dy-textarea dy-textarea-bordered">{dataset?.badWordsGenerated ?? 0}</p>
      <label className="font-semibold">Retries</label>
      <p className="font-semibold dy-textarea dy-textarea-bordered">{dataset?.retries ?? 0}</p>
    </div>
  )
}
export default StatisticsWindow;