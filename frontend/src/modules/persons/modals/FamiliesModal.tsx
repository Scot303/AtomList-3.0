import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Alert } from '@/components/feedback/Alert';
import { Spinner } from '@/components/feedback/Spinner';
import { Input } from '@/components/ui/fields/Input';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { FamilyList } from '../components/familyList/FamilyList';
import { useFamilies } from '../hooks/queries/useFamilies.ts';


export default function FamiliesModal() {
	const { hasPermission } = useAuth();
	const canModify = hasPermission('MODIFY_FAMILIES');

	const families = useFamilies();
	const [search, setSearch] = useState('');

	const filteredFamilies = useMemo(() => {
		const query = search.trim().toLocaleLowerCase();

		if (query === '') {
			return families.data ?? [];
		}

		return ( families.data ?? [] ).filter((family) => (
			family.name.toLocaleLowerCase().includes(query)
			|| family.phone?.toLocaleLowerCase().includes(query)
			|| family.note?.toLocaleLowerCase().includes(query)
			|| family.members.some((member) => (
				member.name.toLocaleLowerCase().includes(query)
				|| member.lastName.toLocaleLowerCase().includes(query)
				|| member.fullName.toLocaleLowerCase().includes(query)
			))
		));

	}, [families.data, search]);

	if (families.isPending) {
		return (
			<div className="flex justify-center py-10">
				<Spinner/>
			</div>
		);
	}

	if (families.isError) {
		return <Alert tone="danger">{ families.error.message }</Alert>;
	}

	return (
		<div className="mt-2 space-y-10">
			<Input
				label=""
				autoFocus
				type="search"
				value={ search }
				onChange={ (event) => setSearch(event.target.value) }
				placeholder="Nazwa rodziny, osoba, telefon lub notatka"
				icon={ <Search aria-hidden className="size-4"/> }
			/>

			<FamilyList families={ filteredFamilies } canModify={ canModify }/>
		</div>
	);
}
