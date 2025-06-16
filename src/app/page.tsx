'use client';

import { useEffect, useState } from 'react';
import { TreeView } from '@/components/TreeView/TreeView';
import { NodeService } from '@/library/powersync/NodeService';
import { usePowerSync } from '@powersync/react';
import { useQuery, useStatus } from '@powersync/react';
import { AbstractPowerSyncDatabase } from '@powersync/web';
import store from '@/stores/RootStore';
import { observer } from 'mobx-react-lite';
import { v5 as uuidv5 } from 'uuid';
import { userService } from '@/library/powersync/userService';
import { measureOnce, METRICS, registerLastSync, registerStart, timestamp } from '@/utils/metrics';
import { usePrevious } from '@/hooks/usePrevious';

const Home = observer(() => {
  const db = usePowerSync();

  if (!db) throw new Error('PowerSync context not found');

  const local_id = store.session?.user?.user_metadata?.local_id;
  const [nodeService] = useState(() => new NodeService(db as AbstractPowerSyncDatabase));

  const { data: allNodes } = useQuery('SELECT count(id) as count FROM nodes');
  const { data: userNodes } = useQuery('SELECT count(id) as count FROM nodes WHERE user_id = ?', [local_id]);
  const { data: remoteNodes } = useQuery('SELECT count(id) as count FROM nodes WHERE user_id = ? AND _is_pending IS NULL', [local_id]);
  const prevCount = usePrevious(remoteNodes?.[0]?.count);
  const { data: nodes } = useQuery(`
    WITH parent AS (
      SELECT id, parent_id
      FROM nodes
      WHERE id = (
        SELECT parent_id
        FROM nodes
        WHERE id = ? AND ? IS NOT NULL
      )
    ),
    siblings AS (
      SELECT n.id
      FROM nodes n
      WHERE n.parent_id = (
        SELECT parent_id
        FROM nodes
        WHERE id = ? AND ? IS NOT NULL
      )
    ),
    children AS (
      SELECT id
      FROM nodes
      WHERE parent_id = ? AND ? IS NOT NULL
    ),
    focused_nodes AS (
      SELECT id FROM parent
      UNION
      SELECT id FROM siblings
      UNION
      SELECT id FROM children
      UNION
      SELECT ? AS id WHERE ? IS NOT NULL
    )
    SELECT * FROM nodes
    WHERE user_id = ?
      ${store.showArchivedNodes ? '' : 'AND archived_at IS NULL'}
      ${store.isFocusedView ? 'AND id IN (SELECT id FROM focused_nodes)' : ''}
    ORDER BY created_at DESC, id
  `, [
    store.selectedNodeId, store.selectedNodeId,
    store.selectedNodeId, store.selectedNodeId,
    store.selectedNodeId, store.selectedNodeId,
    store.selectedNodeId, store.selectedNodeId,
    local_id
  ]);
  const { data: buckets } = useQuery(`SELECT count(DISTINCT bucket) as bucket_count FROM ps_oplog`);
  const { data: pendingUpload } = useQuery('select count(distinct tx_id) as count from ps_crud');
  const { downloadProgress, dataFlowStatus, connected, hasSynced } = useStatus();

  console.debug('Query results:', {
    allNodes: allNodes?.[0]?.count,
    userNodes: userNodes?.[0]?.count,
    remoteNodes: remoteNodes?.[0]?.count,
    nodesLength: nodes?.length,
    selectedNodeId: store.selectedNodeId,
    local_id
  });

  const [remoteCount, setRemoteCount] = useState<number | null>(null);

  useEffect(() => {
    registerStart();
  }, []);

  useEffect(() => {
    registerLastSync();
  }, [nodes]);

  useEffect(() => {
    if (!store.selectedNodeId) {
      store.setSelectedNodeId(uuidv5("ROOT_NODE", userService.getUserId()));
    }
  }, []);

  if (allNodes[0]?.count > 0) {
    measureOnce(METRICS.TIME_TO_INTERACTION);
  }

  return (
    <main className="flex h-[calc(100vh-theme(spacing.16))]">
      <aside className="hidden sm:flex sm:w-72 py-1 px-2 border-r flex-col gap-0.5 text-xs">
        <div className="text-gray-600 leading-tight">User's buckets: <b className="text-black">{buckets[0]?.bucket_count ?? 0}</b></div>
        <div className="text-gray-600 leading-tight">User nodes: <b className="text-black">{userNodes[0]?.count ?? 0}</b></div>
        <div className="text-gray-600 leading-tight">Selected ID: <b className="text-black truncate block">{store.selectedNodeId}</b></div>
        <div className="text-gray-600 leading-tight">Selected nodes count: <b className="text-black">{store._syncedNodes.length}</b></div>
        <div className="leading-tight">
          {connected ?
            <span className='text-green-500'>Connected</span> :
            <span className='text-red-500'>Disconnected</span>}
          {' • '}
          {hasSynced ?
            <span className='text-green-500'>Initial sync done</span> :
            <span className='text-red-500'>Pending initial sync</span>}
        </div>
        {dataFlowStatus.downloading && (
          <>
            <div className="text-blue-600 leading-tight">
              <div>Downloading...</div>
              <div>
                {downloadProgress.downloadedOperations}
                / {downloadProgress.totalOperations}
                {` `} ({Math.round(downloadProgress.downloadedFraction * 10000) / 100}%)
              </div>
            </div>
          </>
        )}
        {dataFlowStatus.uploading && <>
          <div className="text-blue-600 leading-tight">
            Uploading... ({pendingUpload[0]?.count ?? 0})
          </div>
        </>}
      </aside>
      <section className="flex-1 h-full overflow-y-auto">
        <TreeView
          nodes={nodes}
          nodeService={nodeService}
        />
      </section>
    </main>
  );
});

export default Home;
