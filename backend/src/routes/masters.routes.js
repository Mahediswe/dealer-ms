import { Router } from 'express';
import { crudRouter } from '../utils/crudRouter.js';

const router = Router();

router.use('/categories', crudRouter('categories', 'products'));
router.use('/brands', crudRouter('brands', 'products'));
router.use('/units', crudRouter('units', 'products'));
router.use('/warehouses', crudRouter('warehouses', 'inventory'));
router.use('/suppliers', crudRouter('suppliers', 'purchase'));
router.use('/territories', crudRouter('territories', 'salesmen'));
router.use('/dealer-groups', crudRouter('dealer_groups', 'dealers'));

export default router;
