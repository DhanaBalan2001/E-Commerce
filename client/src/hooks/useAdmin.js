import { adminService } from '../services';
import { useApi, useMutation } from './useApi';

export const useAdminDashboard = () => {
  return useApi(adminService.getDashboardStats, [], { immediate: true });
};

export const useAdminUsers = (initialParams = {}) => {
  const [params, setParams] = useState(initialParams);
  
  const usersQuery = useApi(
    () => adminService.getUsers(params),
    [params],
    { immediate: true }
  );

  const updateParams = useCallback((newParams) => {
    setParams(prev => ({ ...prev, ...newParams }));
  }, []);

  return {
    ...usersQuery,
    params,
    updateParams
  };
};

export const useAdminManagement = () => {
  const adminsQuery = useApi(adminService.getAdmins, [], { immediate: true });
  
  const createAdminMutation = useMutation(adminService.createAdmin, {
    onSuccess: () => {
      adminsQuery.refetch();
    }
  });

  const updateAdminMutation = useMutation(adminService.updateAdmin, {
    onSuccess: () => {
      adminsQuery.refetch();
    }
  });

  const deleteAdminMutation = useMutation(adminService.deleteAdmin, {
    onSuccess: () => {
      adminsQuery.refetch();
    }
  });

  return {
    admins: adminsQuery.data,
    loading: adminsQuery.loading,
    error: adminsQuery.error,
    createAdmin: createAdminMutation,
    updateAdmin: updateAdminMutation,
    deleteAdmin: deleteAdminMutation,
    refetch: adminsQuery.refetch
  };
};
