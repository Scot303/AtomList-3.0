import { useQuery } from '@tanstack/react-query';
import { fetchPersons } from '../api/personsApi';
import { personKeys } from '../api/personKeys';

export function usePersons() {
	return useQuery({
		queryKey: personKeys.list(),
		queryFn: fetchPersons,
	});
}
