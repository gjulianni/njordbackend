import {Router} from 'express';
import { authenticate } from '../../middlewares/verifyToken';
import { authorizeAdmin } from '../../middlewares/authorizeAdmin';
import { deleteUser, updateUser } from '../../controllers/admin/userManagementController';
import { countDocuments } from '../../controllers/admin/databaseManagementController';

const adminRouter = Router();

adminRouter.delete("/deleteuser", authenticate, authorizeAdmin, deleteUser);
adminRouter.put("/updateuser", authenticate, authorizeAdmin, updateUser);
adminRouter.get("/countdata", authenticate, authorizeAdmin, countDocuments);

export default adminRouter;
