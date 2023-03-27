import { createPreviewMedia, resizeImage } from "@/core/utils/upload";
import {
	Box,
	Button,
	Center,
	Flex,
	FormControl,
	FormHelperText,
	Highlight,
	Icon,
	Image,
	Input,
	List,
	Select,
	SimpleGrid,
	Spinner,
	Text,
	useToast,
	VStack,
} from "@chakra-ui/react";
import axios from "axios";
import { useS3Upload } from "next-s3-upload";
import { useState, useEffect, ChangeEvent } from "react";
import { useDropzone } from "react-dropzone";
import { MdCheckCircle, MdCloud } from "react-icons/md";
import { IoIosClose } from "react-icons/io";
import { useMutation } from "react-query";
import AvatarsPlaceholder from "../home/AvatarsPlaceholder";
import { CheckedListItem } from "../home/Pricing";
import UploadErrorMessages from "./UploadErrorMessages";

type TUploadState = "not_uploaded" | "uploading" | "uploaded";
export type FilePreview = (File | Blob) & { preview: string };

const Uploader = ({ handleOnAdd }: { handleOnAdd: () => void }) => {
	const [selectedImage, setSelectedImage] = useState<File | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);

	const [file, setFile] = useState<File | null>(null);
	const [uploadState, setUploadState] =
		useState<TUploadState>("not_uploaded");
	const [errorMessages, setErrorMessages] = useState<string[]>([]);
	const [removedBackgroundImage, setRemovedBackgroundImage] =
		useState<string>("");
	const [urls, setUrls] = useState<string[]>([]);
	const [studioName, setStudioName] = useState<string>("");
	const [instanceClass, setInstanceClass] = useState<string>("man");
	const { uploadToS3 } = useS3Upload();
	const toast = useToast();

	const { getRootProps, getInputProps } = useDropzone({
		accept: {
			"image/png": [".png"],
			"image/jpeg": [".jpeg", ".jpg"],
		},
		maxFiles: 1,
		maxSize: 10000000, // 10mo
		onDropRejected: (events) => {
			setErrorMessages([]);
			const messages: { [key: string]: string } = {};

			events.forEach((event) => {
				event.errors.forEach((error) => {
					messages[error.code] = error.message;
				});
			});

			setErrorMessages(Object.keys(messages).map((id) => messages[id]));
		},
		onDrop: (acceptedFiles) => {
			if (file?.length > 1) {
				toast({
					title: `You can't upload more than 1 image`,
					duration: 3000,
					isClosable: true,
					position: "top-right",
					status: "error",
				});
			} else {
				setErrorMessages([]);
				setSelectedImage(acceptedFiles[0]);
			}
		},
	});

	// Function to handle file input changes
	const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
		if (event.target.files) {
			setSelectedImage(event.target.files[0]);
		}
	};

	useEffect(() => {
		handleSubmitImage();
	}, [selectedImage]);

	// Function to call the Next.js API route when the user submits an image
	const handleSubmitImage = async () => {
		if (!selectedImage) {
			return;
		}

		const { url } = await uploadToS3(selectedImage);

		try {
			fetch("/api/remove-bg", {
				method: "POST",
				body: url,
			})
				.then((r) => r.json())
				.then((response) => setPreviewUrl(response.data));
		} catch (error: any) {
			console.error("Error");
		}
	};

	return (
		<Box>
			{previewUrl ? (
				<Image
					src={previewUrl}
					width="500"
					height={500}
					alt="Processed image"
				/>
			) : (
				<Center
					_hover={{
						bg: "whiteAlpha.800",
					}}
					transition="all 0.2s"
					backgroundColor="whiteAlpha.500"
					cursor="pointer"
					borderRadius="xl"
					border="1px dashed gray"
					p={10}
					flexDirection="column"
					{...getRootProps({ className: "dropzone" })}
				>
					<input {...getInputProps()} />
					<Box mb={4} position="relative">
						<AvatarsPlaceholder character="sacha" />
					</Box>
					<VStack textAlign="center" spacing={1}>
						<Box fontWeight="bold" fontSize="2xl">
							Drag and drop or click to upload
						</Box>
						<Box fontWeight="bold" fontSize="lg">
							<Highlight
								query="a photo"
								styles={{ bg: "brand.500", px: 1 }}
							>
								Upload a photo of your product.
							</Highlight>
						</Box>
						<Box maxWidth="container.sm">
							<Text mt={4}>
								Product AI can automatically remove the
								background of your photo!
							</Text>
						</Box>
						{/* <Box>
							<List mt={4} textAlign="left">
								<CheckedListItem>
									Mix it up - change body pose, background,
									and lighting in each photo
								</CheckedListItem>
								<CheckedListItem>
									Capture a range of expressions
								</CheckedListItem>
								<CheckedListItem>
									{`Show the subject's eyes looking in different directions`}
								</CheckedListItem>
							</List>
						</Box> */}
						{errorMessages?.length !== 0 && (
							<UploadErrorMessages messages={errorMessages} />
						)}
					</VStack>
				</Center>
			)}

			{uploadState === "uploaded" && (
				<SimpleGrid
					gap={4}
					columns={{ base: 1, md: 3 }}
					as="form"
					onSubmit={(e) => {
						e.preventDefault();
						handleCreateProject();
					}}
					mt={4}
					alignItems="flex-start"
				>
					<FormControl>
						<Input
							isRequired
							backgroundColor="white"
							placeholder="Studio name"
							value={studioName}
							onChange={(e) =>
								setStudioName(e.currentTarget.value)
							}
						/>
					</FormControl>
					<FormControl>
						<Input
							value={instanceClass}
							onChange={(e) =>
								setInstanceClass(e.currentTarget.value)
							}
							backgroundColor="white"
						/>

						<FormHelperText color="blackAlpha.600">
							Type of product, e.g. mug, shoe, watch, perfume...
						</FormHelperText>
					</FormControl>
					<Box>
						<Button
							disabled={!Boolean(studioName)}
							isLoading={isLoading}
							variant="brand"
							rightIcon={<MdCheckCircle />}
							onClick={() => {
								if (studioName && instanceClass) {
									handleCreateProject();
								}
							}}
						>
							Create your Studio
						</Button>
					</Box>
				</SimpleGrid>
			)}
		</Box>
	);
};

export default Uploader;
