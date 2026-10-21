# NBDT UI redesign

## Scope
UI update based on the supplied screenshots. Existing project data structures and the Master Timeline remain. New Weekly Tracker Overview / Week / List, system cards and stage-based system guide. Configuration Report and Issues use the shared light theme. No SQL Server / backend migration is included.

## Local launch
1. Install Node.js 22.12+ and npm.
2. In this directory run `npm install`.
3. Run `npm run dev` and open the local address printed by Vite.
4. `npm run build` creates the production frontend; `npm run preview` previews it locally.

The supplied original lockfile was not in sync with package.json. It is intentionally omitted; npm install generates a fresh lockfile. Review dependencies and commit that lockfile before deployment.

## Safe default
Without configuration, VITE_DATA_MODE defaults to local. No Firebase app is initialized and no Firebase reads or writes are performed. Local state uses a separate nbdt_redesign_local_ prefix. Existing original localStorage records are not modified. Existing seed records from the original source are retained, not live project data. No new illustrative device counts are added.

The local Edit mode dialog accepts any input: it is a UI sandbox, NOT authentication. Do not publish this as a protected application. The legacy Firebase mode retains the original frontend password logic; this is NOT production security. No backend authorization has been implemented.

## Optional legacy Firebase mode
Only after backup and security review, set VITE_DATA_MODE=firebase in .env.local and restart Vite. This enables the original Firebase configuration and sync. This can change the original database. The UI redesign has not been tested against the live database. Never enable it merely to preview the new interface.

## Data compatibility
Existing systems/tasks/checklists are retained. Optional description and documentationUrl fields are added to systems. Engineering notes remain in documentation; only documentationUrl is treated as an HTTPS link. No inferred links or fake completion counts are created. Weekly labels are project-relative (Week 1..28), not ISO calendar weeks. The guide uses system-level checklists from the original model, NOT per-device completion. Preparation, shared-task roles, device inventory and Deployed counters shown in the reference images are not implemented because the original data model has no corresponding fields.

## Deployment boundary
This is a frontend redesign, not a production-ready RCG deployment. Backend authentication, SQL Server migration, secrets, logging, corporate networking and security approvals remain separate work.
