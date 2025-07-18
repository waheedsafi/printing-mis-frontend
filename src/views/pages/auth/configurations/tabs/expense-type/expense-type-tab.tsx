import NastranModel from "@/components/custom-ui/model/NastranModel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";
import { useGlobalState } from "@/context/GlobalStateContext";
import axiosClient from "@/lib/axois-client";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import PrimaryButton from "@/components/custom-ui/button/PrimaryButton";
import CustomInput from "@/components/custom-ui/input/CustomInput";
import { Search } from "lucide-react";
import Shimmer from "@/components/custom-ui/shimmer/Shimmer";
import TableRowIcon from "@/components/custom-ui/table/TableRowIcon";
import { SimpleItem, UserPermission } from "@/database/tables";
import { PermissionEnum } from "@/lib/constants";
import { toLocaleDate } from "@/lib/utils";
import ExpenseTypeDialog from "./expense-type-dialog";
interface ExpenseTypeTabProps {
  permissions: UserPermission;
}
export default function ExpenseTypeTab(props: ExpenseTypeTabProps) {
  const { permissions } = props;
  const { t } = useTranslation();
  const [state] = useGlobalState();
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<{
    visible: boolean;
    expenseType: any;
  }>({
    visible: false,
    expenseType: undefined,
  });
  const [expenseTypes, setExpenseTypes] = useState<{
    unFilterList: SimpleItem[];
    filterList: SimpleItem[];
  }>({
    unFilterList: [],
    filterList: [],
  });
  const initialize = async () => {
    try {
      if (loading) return;
      setLoading(true);

      // 2. Send data
      const response = await axiosClient.get(`expense-types`);
      const fetch = response.data as SimpleItem[];
      setExpenseTypes({
        unFilterList: fetch,
        filterList: fetch,
      });
    } catch (error: any) {
      toast({
        toastType: "ERROR",
        description: error.response.data.message,
      });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    initialize();
  }, []);

  const searchOnChange = (e: any) => {
    const { value } = e.target;
    // 1. Filter
    const filtered = expenseTypes.unFilterList.filter((item: SimpleItem) =>
      item.name.toLowerCase().includes(value.toLowerCase())
    );
    setExpenseTypes({
      ...expenseTypes,
      filterList: filtered,
    });
  };
  const onComplete = (expenseType: SimpleItem, edited: boolean) => {
    if (edited) {
      setExpenseTypes((prevState) => {
        const updatedUnFiltered = prevState.unFilterList.map((item) =>
          item.id === expenseType.id
            ? {
                ...item,
                name: expenseType.name,
              }
            : item
        );

        return {
          ...prevState,
          unFilterList: updatedUnFiltered,
          filterList: updatedUnFiltered,
        };
      });
    } else {
      setExpenseTypes((prev) => ({
        unFilterList: [expenseType, ...prev.unFilterList],
        filterList: [expenseType, ...prev.filterList],
      }));
    }
  };
  const dailog = useMemo(
    () => (
      <NastranModel
        size="lg"
        visible={selected.visible}
        isDismissable={false}
        button={<button></button>}
        showDialog={async () => {
          setSelected({
            visible: false,
            expenseType: undefined,
          });
          return true;
        }}
      >
        <ExpenseTypeDialog
          expenseType={selected.expenseType}
          onComplete={onComplete}
        />
      </NastranModel>
    ),
    [selected.visible]
  );
  const per = permissions.sub.get(
    PermissionEnum.configurations.sub.expense_configuration_expense_type
  );
  const hasEdit = per?.edit;
  const hasAdd = per?.add;
  const hasView = per?.view;
  return (
    <div className="relative">
      <div className="rounded-md bg-card p-2 flex gap-x-4 items-baseline mt-4">
        {hasAdd && (
          <NastranModel
            size="lg"
            isDismissable={false}
            button={
              <PrimaryButton className="text-primary-foreground">
                {t("add_expense_type")}
              </PrimaryButton>
            }
            showDialog={async () => true}
          >
            <ExpenseTypeDialog onComplete={onComplete} />
          </NastranModel>
        )}

        <CustomInput
          size_="lg"
          placeholder={`${t("search")}...`}
          parentClassName="flex-1"
          type="text"
          onChange={searchOnChange}
          startContent={
            <Search className="size-[18px] mx-auto rtl:mr-[4px] text-primary pointer-events-none" />
          }
        />
      </div>
      <Table className="bg-card rounded-md mt-1 py-8 w-full">
        <TableHeader className="rtl:text-3xl-rtl ltr:text-xl-ltr">
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-start">{t("id")}</TableHead>
            <TableHead className="text-start">{t("name")}</TableHead>
            <TableHead className="text-start">{t("date")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="rtl:text-xl-rtl ltr:text-lg-ltr">
          {loading ? (
            <TableRow>
              <TableCell>
                <Shimmer className="h-[24px] w-full rounded-sm" />
              </TableCell>
              <TableCell>
                <Shimmer className="h-[24px] w-full rounded-sm" />
              </TableCell>
              <TableCell>
                <Shimmer className="h-[24px] w-full rounded-sm" />
              </TableCell>
            </TableRow>
          ) : (
            expenseTypes.filterList.map((expenseType: SimpleItem) => (
              <TableRowIcon
                read={hasView}
                remove={false}
                edit={hasEdit}
                onEdit={async (item: SimpleItem) => {
                  setSelected({
                    visible: true,
                    expenseType: item,
                  });
                }}
                key={expenseType.id}
                item={expenseType}
                onRemove={async () => {}}
                onRead={async () => {}}
              >
                <TableCell className="font-medium">{expenseType.id}</TableCell>
                <TableCell>{expenseType.name}</TableCell>
                <TableCell>
                  {toLocaleDate(new Date(expenseType.created_at), state)}
                </TableCell>
              </TableRowIcon>
            ))
          )}
        </TableBody>
      </Table>
      {dailog}
    </div>
  );
}
